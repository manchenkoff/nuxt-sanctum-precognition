import { describe, it, expect } from 'vitest'
import { useNuxtFormValidator } from '../../../src/runtime/composables/useNuxtFormValidator'
import type { PrecognitionForm, Payload } from '../../../src/runtime/types'

function createMockForm(validateWithErrors: () => ReturnType<PrecognitionForm<Payload>['validateWithErrors']>): PrecognitionForm<Payload> {
  return {
    validateWithErrors,
  } as PrecognitionForm<Payload>
}

describe('useNuxtFormValidator', () => {
  it('returns validation function', () => {
    const form = createMockForm(async () => ({}))
    const validate = useNuxtFormValidator(form)

    expect(validate).toBeInstanceOf(Function)
  })

  it('returns empty list when form is valid', async () => {
    const form = createMockForm(async () => ({}))
    const validate = useNuxtFormValidator(form)

    const errors = await validate()

    expect(errors).toEqual([])
  })

  it('returns empty list when form has fields with no errors', async () => {
    const form = createMockForm(async () => ({
      email: [],
      password: [],
    }))

    const validate = useNuxtFormValidator(form)

    const errors = await validate()

    expect(errors).toEqual([])
  })

  it('returns empty list when form has fields with undefined errors', async () => {
    const form = createMockForm(async () => ({
      email: undefined,
      password: [],
    }))

    const validate = useNuxtFormValidator(form)

    const errors = await validate()

    expect(errors).toEqual([])
  })

  it('returns error list when form is invalid', async () => {
    const form = createMockForm(async () => ({
      email: ['The email field is required.'],
    }))

    const validate = useNuxtFormValidator(form)

    const errors = await validate()

    expect(errors).toEqual([
      { name: 'email', message: 'The email field is required.' },
    ])
  })

  it('returns first error for each field', async () => {
    const form = createMockForm(async () => ({
      email: ['The email field is required.', 'The email must be a valid email address.'],
      password: ['The password must be at least 8 characters.'],
    }))

    const validate = useNuxtFormValidator(form)

    const errors = await validate()

    expect(errors).toEqual([
      { name: 'email', message: 'The email field is required.' },
      { name: 'password', message: 'The password must be at least 8 characters.' },
    ])
  })
})
