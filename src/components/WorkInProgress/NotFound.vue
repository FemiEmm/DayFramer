<!-- src/components/ErrorPages/NotFound.vue -->
<template>
  <div class="page-content">
    <section class="hero">
      <!-- Image -->
      <div class="hero-image">
        <div class="circle-img">
          <img :src="notFoundImg" alt="404 Not Found" />
        </div>
      </div>

      <!-- Text -->
      <div class="hero-text">
        <h1 class="hero-title">404 – Page Not Found</h1>
        <p class="hero-sub">
          Oops! The page you’re looking for doesn’t exist or may have been moved.
        </p>

        <div class="hero-ctas">
          <button class="btn btn-secondary" @click="goBack">← Back</button>
          <button class="btn btn-primary" @click="goHome">Go to Homepage</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import notFoundImg from "@/assets/wip/404.png";

export default defineComponent({
  name: "NotFound",
  setup() {
    const router = useRouter();
    const goBack = () => router.back();
    const goHome = () => router.push({ name: "Homepage" });

    return { goBack, goHome, notFoundImg };
  },
});
</script>

<style scoped>
.page-content {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  background-color: var(--background-color);
  color: var(--primary-text-color);
}

.hero {
  max-width: 900px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 48px;
  align-items: center;
}

.hero-image {
  display: flex;
  justify-content: center;
}
.circle-img {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 14px 40px rgba(0,0,0,0.18);
  border: 2px solid rgba(0,0,0,0.08);
}
.circle-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.hero-title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
  margin: 0;
  text-align: left;
}
.hero-sub {
  font-size: 16px;
  color: var(--secondary-text-color);
  max-width: 480px;
  text-align: left;
}
.hero-ctas {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}

.btn {
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.btn-primary {
  background: var(--button-color);
  color: var(--secondary-text-color);
}
.btn-primary:hover {
  background: var(--button-hover-color);
  color: var(--primary-text-color);
}
.btn-secondary {
  background: var(--white);
  color: var(--primary-text-color);
  border: 1px solid #ddd;
}
.btn-secondary:hover {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-text { align-items: center; }
  .hero-sub { text-align: center; }
}
</style>
