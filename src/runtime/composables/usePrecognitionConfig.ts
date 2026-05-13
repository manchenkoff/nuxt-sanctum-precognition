import type { ModuleOptions } from '../types'
import { useNuxtApp } from '#app'

/**
 * Returns the Precognition runtime module configuration.
 */
export const usePrecognitionConfig = (): ModuleOptions => {
  return useNuxtApp().$config.public.precognition as ModuleOptions
}
