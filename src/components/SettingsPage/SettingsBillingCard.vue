<template>
  <section class="card">
    <h2 class="h2">Billing</h2>
    <div class="stack">
      <div class="empty">Plan, invoices, payment method (placeholder)</div>
      <div class="row">
        <button class="btn btn-secondary" @click="onCoupon">Apply coupon</button>
        <button class="btn btn-plain" @click="onCancel">Cancel plan</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
function onCoupon() { alert("Coupon flow coming soon."); }
function onCancel() { alert("Cancel flow coming soon."); }
</script>

<style scoped>
.card { background:#fff;border:1px solid #eee;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.06);padding:16px; }
.h2 { margin:0 0 10px;font-weight:800;font-size:18px; }
.stack { display:grid;gap:8px; }
.row { display:flex;align-items:center;gap:8px; }
.empty { color:#777;font-size:13px; }
.btn { padding:10px 14px;border-radius:12px;border:1px solid transparent;background:var(--button-color);color:var(--secondary-text-color);font-weight:700;cursor:pointer; }
.btn.btn-secondary{background:#fff;color:#111;border:1px solid #e5e7eb;}
.btn.btn-plain{background:#fff;color:#111;border:1px solid #e5e7eb;}
</style>
