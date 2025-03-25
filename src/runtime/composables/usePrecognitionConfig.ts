import type { ModuleOptions } from '../types'
import { useNuxtApp } from '#imports'

export const usePrecognitionConfig = (): ModuleOptions => {
  return useNuxtApp().$config.public.precognition as ModuleOptions
}
