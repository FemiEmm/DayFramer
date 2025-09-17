<template>
    <nav class="month-navigation">
      <button
        v-for="month in months"
        :key="month"
        @click="$emit('selectMonth', month)"
      >
        {{ month }}
      </button>
    </nav>
  </template>
  
  <script lang="ts">
  import { defineComponent, PropType } from "vue";
  
  export default defineComponent({
    name: "MonthNavigation",
    props: {
      months: {
        type: Array as PropType<string[]>,
        required: true,
      },
    },
  });
  </script>
  