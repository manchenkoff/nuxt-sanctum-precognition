<script setup lang="ts">
import { ref } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[]>([
  {
    label: 'Simple Form',
    icon: 'i-lucide-badge',
    to: '/forms/simple',
  },
  {
    label: 'Nuxt UI Form',
    icon: 'i-lucide-badge-check',
    to: '/forms/nuxtui',
  },
])
</script>

<template>
  <UNavigationMenu
    :items="items"
    class="w-full justify-center"
  />

  <div class="container mx-auto px-10 pt-10">
    <slot />
  </div>
</template>
