import { useNuxtApp } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModuleOptions } from '~/src/runtime/types'
import { usePrecognitionConfig } from '../../../src/runtime/composables/usePrecognitionConfig'

mockNuxtImport('useNuxtApp', original => vi.fn(() => original()))

const DEFAULT_CONFIG: ModuleOptions = {
  validateFiles: false,
  validationTimeout: 500,
  logLevel: 3,
}

describe('usePrecognitionConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined if no config', () => {
    const result = usePrecognitionConfig()

    expect(result).toBeUndefined()
  })

  it('returns public config when defined', () => {
    const impl = vi.mocked(useNuxtApp).getMockImplementation()!

    vi.mocked(useNuxtApp).mockImplementation(() => {
      const result = impl()
      result.$config.public.precognition = DEFAULT_CONFIG
      return result
    })

    const result = usePrecognitionConfig()

    expect(result).toEqual(DEFAULT_CONFIG)
  })
})
