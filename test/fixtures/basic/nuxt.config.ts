import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],

  sanctum: {
    client: {
      initialRequest: false,
    },
  },
})
