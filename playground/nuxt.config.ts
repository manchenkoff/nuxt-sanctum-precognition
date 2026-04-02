export default defineNuxtConfig({
  modules: [
    '../src/module',
    '@nuxt/ui',
  ],
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  precognition: {},
})
