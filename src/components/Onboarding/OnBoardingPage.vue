<template>
  <div class="ob-wrap">
    <header class="topbar">
      <nav class="topbar-inner">
        <div class="brand" @click="goBrand">
          <i class="icon fa-solid fa-calendar-days"></i>
          <span class="brand-text">Dayframe</span>
        </div>
        <div class="spacer"></div>
        <div class="right">
          <button class="tb-btn" @click="goWip">Resources</button>
          <button class="tb-btn" @click="goWip">Pricing</button>
          <button class="tb-btn" @click="goWip">Contact</button>
          <span class="sep">|</span>
          <button class="tb-btn" @click="goLogin">Log in</button>
          <button class="tb-btn tb-accent" @click="goSignup">Sign up</button>
        </div>
      </nav>
    </header>

    <main>
      <!-- Row 1 -->
      <section class="row">
        <div class="text-col">
          <h1 class="t-title">Plan less <br> Achieve more.</h1>
          <p class="t-sub">
            With Dayframe, you’ll plan your day smarter, stay on top of reminders, and get gentle nudges to take breaks when you need them.
          </p>
          <button class="btn btn-primary" @click="learnMore('row2')">Learn more</button>
        </div>
        <div class="image-col">
          <img :src="image1" alt="Onboarding visual 1" />
        </div>
      </section>

      <!-- Row 2 (scroll target) -->
      <section class="row" ref="row2Ref">
        <div class="image-col">
          <img :src="image2" alt="Onboarding visual 2" />
        </div>
        <div class="text-col2">
          <h1 class="t-title">Your day, <br> at a glance</h1>
          <p class="t-sub">See all your tasks and schedule in one clean view. Stay organized with a daily timeline and quick calendar access.</p>
        </div>
      </section>

      <!-- Row 3 -->
      <section class="row">
        <div class="text-col">
          <h1 class="t-title">Plan less <br> Achieve more.</h1>
          <p class="t-sub">
            With Dayframe, you’ll plan your day smarter, stay on top of reminders, and get gentle nudges to take breaks when you need them.
          </p>
          <button class="btn btn-primary" @click="learnMore('endnote')">Learn more</button>
        </div>
        <div class="image-col3">
          <img :src="image3" alt="Onboarding visual 3" />
        </div>
      </section>

      <!-- Endnote (scroll target) -->
      <div class="endnote" ref="endnoteRef">
        <h2>🚀 “Join thousands redefining productivity” </h2>
        <p>“Less juggling, more doing. Start your journey with Dayframe and get back control of your time.”</p>
        <button class="tb-btn" @click="goLogin">Log in</button>
        <button class="tb-btn tb-accent" @click="goSignup">Sign up</button>
      </div>
    </main>

    <section class="footer-links">
      <div class="links-grid">
        <div class="group">
          <div class="gh">Features</div>
          <a href="#" class="gl" @click.prevent="goWip">How It Works</a>
          <a href="#" class="gl" @click.prevent="goWip">For Teams</a>
          <a href="#" class="gl" @click.prevent="goWip">Pricing</a>
          <a href="#" class="gl" @click.prevent="goWip">Templates</a>
          <a href="#" class="gl" @click.prevent="goWip">Resources</a>
        </div>
        <div class="group">
          <div class="gh">Download Apps</div>
          <a href="#" class="gl" @click.prevent="goWip">Help Center</a>
          <a href="#" class="gl" @click.prevent="goWip">Productivity Methods</a>
          <a href="#" class="gl" @click.prevent="goWip">Integrations</a>
          <a href="#" class="gl" @click.prevent="goWip">Channel Partners</a>
          <a href="#" class="gl" @click.prevent="goWip">Developer API</a>
          <a href="#" class="gl" @click.prevent="goWip">Status</a>
        </div>
        <div class="group">
          <div class="gh">Company</div>
          <a href="#" class="gl" @click.prevent="goWip">About Us</a>
          <a href="#" class="gl" @click.prevent="goWip">Careers</a>
          <a href="#" class="gl" @click.prevent="goWip">Inspiration Hub</a>
          <a href="#" class="gl" @click.prevent="goWip">Press</a>
          <a href="#" class="gl" @click.prevent="goWip">Twist</a>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase"; // change if your client file is named differently
import hero1 from "@/assets/onboarding/hero-1.jpg";
import hero2 from "@/assets/onboarding/hero-2.jpg";
import hero3 from "@/assets/onboarding/hero-3.jpg";

export default defineComponent({
  name: "OnBoardingPage",
  setup() {
    const router = useRouter();

    // Smooth-scroll targets
    const row2Ref = ref<HTMLElement | null>(null);
    const endnoteRef = ref<HTMLElement | null>(null);

    function scrollToEl(el: HTMLElement | null) {
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function learnMore(target: "row2" | "endnote") {
      if (target === "row2") scrollToEl(row2Ref.value);
      else scrollToEl(endnoteRef.value);
    }

    // Session-aware navigation for auth
    async function goLogin() {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.push({ name: "Homepage" });
      else router.push({ name: "Welcome", query: { mode: "signin" } });
    }

    async function goSignup() {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.push({ name: "Homepage" });
      else router.push({ name: "Welcome", query: { mode: "signup" } });
    }

    const goBrand = () => router.push({ name: "Homepage" }); // unchanged
    const goWip = () => router.push({ name: "WIP" });

    return {
      // scroll
      row2Ref,
      endnoteRef,
      learnMore,
      // auth-aware actions
      goLogin,
      goSignup,
      goBrand,
      goWip,
      // assets
      image1: hero1,
      image2: hero2,
      image3: hero3,
    };
  },
});
</script>

<style scoped>
.ob-wrap {
  min-height: 100vh;
  background: var(--background-color);
  color: var(--primary-text-color);
  display: flex;
  flex-direction: column;
}

/* Topbar */
.topbar { position: sticky; top: 0; z-index: 5; background: var(--background-color); border-bottom: 1px solid rgba(0,0,0,.06); }
.topbar-inner { display: flex; align-items: center; height: 56px; padding: 0 24px; gap: 10px; }
.brand { display: inline-flex; align-items: center; gap: 8px; color: var(--button-color); cursor: pointer; padding: 6px 8px; border-radius: 999px; }
.brand:hover { background: rgba(0,0,0,.06); }
.brand .icon { font-size: 18px; }
.brand-text { font-weight: 600; letter-spacing: .02em; }
.spacer { flex: 1 1 auto; }
.topbar .right { display: flex; align-items: center; gap: 12px; }
.tb-btn { font: inherit; border: 1px solid transparent; background: transparent; color: var(--button-color); padding: 8px 10px; border-radius: 999px; cursor: pointer; }
.tb-btn:hover { background: rgba(0,0,0,.06); }
.tb-btn.tb-accent { background: var(--button-color); color: var(--secondary-text-color); }
.tb-btn.tb-accent:hover { background: var(--button-hover-color); color: var(--primary-text-color); }
.sep { opacity: .35; margin: 0 4px; }

/* Row */
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0px;
  padding: 0 100px;
  min-height: 100vh;
  margin: -50px 0px -50px 0px;
  border-bottom: 1px solid rgba(0,0,0,.06);
}
.text-col {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}
.text-col2 {
  flex: 1;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-end;
}
.image-col { flex: 1; }
.image-col img {
  width: 100%;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 30px 80px rgba(0,0,0,.25);
  object-fit: contain;
}
.image-col3 img {
  width: 70%;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 30px 80px rgba(0,0,0,.25);
  object-fit: contain;
}

.endnote {
  padding: 100px 0px;
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.t-title { font-weight: 800; font-size: clamp(28px, 5vw, 80px); line-height: 80px; }
.t-sub { font-size: clamp(14px, 2.2vw, 18px); color: var(--secondary-text-color); max-width: 50ch; }

.btn { padding: 12px 18px; border-radius: 999px; font-weight: 700; cursor: pointer; }
.btn-primary { background: var(--button-color); color: var(--secondary-text-color); }
.btn-primary:hover { background: var(--button-hover-color); color: var(--primary-text-color); }

/* Footer */
.footer-links { padding: 60px clamp(20px, 6vw, 80px); background: var(--frame1-color); color: var(--primary-text-color); border-top: 1px solid rgba(0,0,0,.06); }
.links-grid { max-width: 1200px; margin: 0 auto; display: grid; gap: 28px 40px; grid-template-columns: repeat(3, minmax(220px, 1fr)); }
.group { display: grid; gap: 8px; }
.gh { font-weight: 800; font-size: 14px; text-transform: uppercase; opacity: .8; margin-bottom: 8px; }
.gl {
  font-size: 14px;
  color: var(--primary-text-color);
  opacity: .85;
  cursor: pointer;
  text-decoration: none;
}
.gl:hover { opacity: 1; }
</style>
