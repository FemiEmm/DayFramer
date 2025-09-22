// src/plugins/sfx.ts
// Global UI sound plugin: click + hover with composed-path targeting,
// autoplay-safe AudioContext init, and <audio> fallback if decoding fails.

import type { App } from "vue";

type SfxOptions = {
  clickBase?: string;         // e.g. "/click/ClickSound" (no extension)
  hoverBase?: string;         // e.g. "/click/HoverSound" (no extension)
  volume?: number;            // 0..1
  hoverThrottleMs?: number;   // throttle hover playback
  enabled?: boolean;
};

type SfxAPI = {
  play: (name: "click" | "hover") => Promise<void>;
  setEnabled: (on: boolean) => void;
  setVolume: (v: number) => void;
  isEnabled: () => boolean;
  getVolume: () => number;
};

const exts = [".wav", ".mp3", ".ogg", ".WAV", ".MP3", ".OGG"];

async function fetchFirstOk(urls: string[]): Promise<{ url: string; data: ArrayBuffer } | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) return { url, data: await res.arrayBuffer() };
    } catch { /* try next */ }
  }
  return null;
}

/** Find the nearest interactive element using the event's composed path. */
function findInteractiveFromEvent(e: Event): HTMLElement | null {
  const path = (e.composedPath ? e.composedPath() : []) as Element[];
  const candidates = path.length ? path : [e.target as Element];

  // Recognize native controls and common ARIA/button patterns.
  const selector =
    'button:not([disabled]),' +
    'a[href],' +
    'input:not([type="hidden"]):not([disabled]),' +
    'select:not([disabled]),' +
    'textarea:not([disabled]),' +
    '[role="button"],' +
    '[data-sound="click"],[data-sound="hover"]';

  for (const node of candidates) {
    if (!(node instanceof HTMLElement)) continue;
    // explicit opt-out anywhere in the path
    if (node.dataset?.sound === "off") return null;
    if (node.matches(selector)) return node;
  }
  return null;
}

export default {
  install(app: App, opts: SfxOptions = {}) {
    const clickBase = opts.clickBase ?? "/click/ClickSound";
    const hoverBase = opts.hoverBase ?? "/click/HoverSound";
    const volume = { value: Math.min(1, Math.max(0, opts.volume ?? 0.25)) };
    const enabled = { value: opts.enabled ?? true };
    const hoverThrottleMs = opts.hoverThrottleMs ?? 150;

    const state = {
      ctx: null as (AudioContext | null),
      gain: null as (GainNode | null),
      clickBuf: null as (AudioBuffer | null),
      hoverBuf: null as (AudioBuffer | null),

      // <audio> fallback URLs (if decode fails or ctx not available)
      clickURLs: [] as string[],
      hoverURLs: [] as string[],

      lastHoverTs: 0,
      loaded: false
    };

    /** Load audio files. Try WebAudio decode if we already have a context; otherwise keep URLs. */
    async function loadAssets() {
      if (state.loaded) return;
      state.loaded = true;

      const clickTry = await fetchFirstOk(exts.map(e => `${clickBase}${e}`));
      const hoverTry = await fetchFirstOk(exts.map(e => `${hoverBase}${e}`));

      async function decodeOrFallback(which: "click" | "hover", found: {url: string; data: ArrayBuffer} | null) {
        if (!found) return;
        if (state.ctx) {
          try {
            const buf = await state.ctx.decodeAudioData(found.data.slice(0));
            if (which === "click") state.clickBuf = buf; else state.hoverBuf = buf;
          } catch {
            // keep URL for <audio> fallback
            if (which === "click") state.clickURLs.push(found.url); else state.hoverURLs.push(found.url);
          }
        } else {
          // no context yet; store URL for <audio> and/or later decode
          if (which === "click") state.clickURLs.push(found.url); else state.hoverURLs.push(found.url);
        }
      }

      await decodeOrFallback("click", clickTry);
      await decodeOrFallback("hover", hoverTry);
    }

    /** Create AudioContext only after user gesture. */
    async function ensureCtx() {
      if (state.ctx) return;
      const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      state.ctx = new AC();
      state.gain = state.ctx.createGain();
      state.gain.gain.value = volume.value;
      state.gain.connect(state.ctx.destination);

      // If we already have URLs, try to decode one now for better overlap control.
      const tryDecode = async (arr: string[], which: "click" | "hover") => {
        if (!arr.length) return;
        try {
          const res = await fetch(arr[0]);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            const decoded = await state.ctx!.decodeAudioData(buf.slice(0));
            if (which === "click") state.clickBuf = decoded; else state.hoverBuf = decoded;
          }
        } catch { /* keep <audio> fallback */ }
      };

      await tryDecode(state.clickURLs, "click");
      await tryDecode(state.hoverURLs, "hover");
    }

    async function resumeCtx() {
      if (state.ctx && state.ctx.state === "suspended") {
        try { await state.ctx.resume(); } catch { /* ignore */ }
      }
    }

    /** Play via WebAudio if buffer exists; otherwise via <audio>. */
    async function play(name: "click" | "hover") {
      if (!enabled.value) return;
      await loadAssets();
      await ensureCtx();
      await resumeCtx();

      const buf = name === "click" ? state.clickBuf : state.hoverBuf;
      if (buf && state.ctx && state.gain) {
        const ctx = state.ctx;
        const src = ctx.createBufferSource();
        src.buffer = buf;

        // fast fade-in/out to avoid clicks
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(state.gain.gain.value, ctx.currentTime + 0.005);
        const dur = Math.max(0.03, buf.duration);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur - 0.01);

        src.connect(g);
        g.connect(state.gain);
        src.start();
        return;
      }

      // <audio> fallback
      const urls = name === "click" ? state.clickURLs : state.hoverURLs;
      if (urls.length) {
        const a = new Audio(urls[0]);
        a.volume = volume.value;
        void a.play().catch(() => {});
      }
    }

    function setEnabled(on: boolean) { enabled.value = !!on; }
    function setVolume(v: number) {
      volume.value = Math.min(1, Math.max(0, v));
      if (state.gain) state.gain.gain.value = volume.value;
    }
    function isEnabled() { return enabled.value; }
    function getVolume() { return volume.value; }

    // Unlock on user gesture (autoplay policy)
    const unlock = async () => {
      await loadAssets();
      await ensureCtx();
      await resumeCtx();
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      document.removeEventListener("touchstart", unlock, true);
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    document.addEventListener("touchstart", unlock, true);

    // Global CLICK (capture) — uses composed path to find real interactive target
    const onClick = (e: Event) => {
      const el = findInteractiveFromEvent(e);
      if (!el) return;
      void play("click");
    };
    document.addEventListener("click", onClick, true);

    // Global HOVER (capture + throttle)
    const onOver = (e: Event) => {
      const el = findInteractiveFromEvent(e);
      if (!el) return;
      const now = performance.now();
      if (now - state.lastHoverTs < hoverThrottleMs) return;
      state.lastHoverTs = now;
      void play("hover");
    };
    document.addEventListener("mouseover", onOver, true);

    // Optional: keyboard activation for Enter/Space on focusable elements
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      const active = document.activeElement as HTMLElement | null;
      if (!active) return;
      if (!findInteractiveFromEvent(e)) return; // reuse path check
      void play("click");
    };
    document.addEventListener("keydown", onKey, true);

    const api: SfxAPI = { play, setEnabled, setVolume, isEnabled, getVolume };
    app.provide("sfx", api);
    (app.config.globalProperties as any).$sfx = api;
  }
};
