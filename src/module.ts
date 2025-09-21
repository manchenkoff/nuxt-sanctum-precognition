import { defineNuxtModule, createResolver, useLogger, addImportsDir } from '@nuxt/kit'
import defu from 'defu'
import type { ModuleOptions } from './runtime/types'
import { defaultModuleOptions } from './config'

const MODULE_NAME = 'nuxt-sanctum-precognition'

export type ModulePublicRuntimeConfig = { precognition: ModuleOptions }

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: MODULE_NAME,
    configKey: 'precognition',
  },

  moduleDependencies: {
    'nuxt-auth-sanctum': {
      version: '>=1.3.0',
    },
  },

  defaults: defaultModuleOptions,

  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)
    const precognitionConfig = defu(
      _nuxt.options.runtimeConfig.public.precognition,
      _options,
    )

    _nuxt.options.build.transpile.push(resolver.resolve('./runtime'))
    _nuxt.options.runtimeConfig.public.precognition = precognitionConfig

    const logger = useLogger(MODULE_NAME, {
      level: precognitionConfig.logLevel,
    })

    addImportsDir(resolver.resolve('./runtime/composables'))

    logger.info('Precognition module initialized with Sanctum')
  },
})
