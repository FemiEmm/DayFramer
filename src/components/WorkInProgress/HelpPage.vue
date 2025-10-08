<!-- src/components/WorkInProgress/HelpPage.vue -->
<template>
  <section class="help-wrap">
    <header class="help-header">
      <button class="back-btn" @click="goBack" aria-label="Go back">
        ← Back
      </button>
      <h1 class="title">Help & Guide</h1>
    </header>

    <article v-if="html" class="prose" v-html="html" />
    <p v-else class="loading">Loading…</p>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

const router = useRouter();
const html = ref<string>("");

function goBack() {
  if (window.history.length > 1) router.back();
  else router.replace({ name: "Homepage" });
}

onMounted(async () => {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
  });
  // Load the markdown file that sits next to this component
  const mod = await import("./help.md?raw");
  const rendered = md.render(mod.default as string);
  html.value = DOMPurify.sanitize(rendered);
});
</script>

<style scoped>
.help-wrap {
  max-width: 920px;
  margin: 32px auto;
  padding: 0 16px 48px;
  color: var(--primary-text-color);
}
.help-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.back-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: var(--background-color);
  cursor: pointer;
  font-weight: 700;
}
.back-btn:hover { filter: brightness(0.98); }
.title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}
.loading { opacity: .7; }

/* ---------- Markdown (rendered via v-html) ---------- */
/* Ensure the entire markdown block is left-aligned */
.prose { text-align: left !important; }

/* Because styles are scoped, target rendered HTML with :deep() */
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6),
.prose :deep(p),
.prose :deep(li),
.prose :deep(ul),
.prose :deep(ol),
.prose :deep(blockquote),
.prose :deep(table) {
  text-align: left !important;
  margin-left: 0;
  margin-right: 0;
}

/* Simple typography */
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  font-weight: 800;
  line-height: 1.15;
  margin: 18px 0 8px;
}
.prose :deep(h1){ font-size:1.6rem; }
.prose :deep(h2){ font-size:1.25rem; }
.prose :deep(h3){ font-size:1.05rem; }
.prose :deep(p){ margin:8px 0; }
.prose :deep(ul){ padding-left:1.15rem; margin:6px 0; }
.prose :deep(li){ margin:4px 0; }
.prose :deep(strong){ font-weight:800; }
.prose :deep(code){
  background:#f6f7f9;
  border:1px solid #edf0f2;
  border-radius:6px;
  padding:0 4px;
}
</style>
