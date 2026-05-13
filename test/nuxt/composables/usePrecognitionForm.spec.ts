import { describe, it, expect, vi, beforeEach } from 'vitest'
import defu from 'defu'
import type { ModuleOptions, Payload } from '~/src/runtime/types'
import { usePrecognitionForm } from '../../../src/runtime/composables/usePrecognitionForm'
import { isReactive } from 'vue'
import { useNuxtApp } from '#app'

const { mockPrecognitionConfig, mockClient } = vi.hoisted(() => ({
  mockPrecognitionConfig: vi.fn(),
  mockClient: { raw: vi.fn() } as { raw: ReturnType<typeof vi.fn> },
}))

vi.mock(
  '~/src/runtime/composables/usePrecognitionConfig',
  () => ({
    usePrecognitionConfig: mockPrecognitionConfig,
  }),
)

interface LoginForm extends Payload {
  email: string
  password: string
  name: string
}

const PAYLOAD: LoginForm = { email: '', password: '', name: '' }

const ENDPOINT = '/api/login'

const DEFAULT_CONFIG: ModuleOptions = {
  validateFiles: false,
  validationTimeout: 0,
  logLevel: 3,
}

function createForm(
  payload: LoginForm = PAYLOAD,
  configOverrides: Partial<ModuleOptions> = {},
) {
  const config = defu(
    configOverrides,
    structuredClone(DEFAULT_CONFIG),
  ) as ModuleOptions

  mockPrecognitionConfig.mockReturnValue(config)

  return usePrecognitionForm<LoginForm>(
    'post',
    ENDPOINT,
    { ...payload },
  )
}

function okResponse(data?: unknown) {
  return {
    ok: true as const,
    status: 200,
    _data: data,
    headers: { get: () => null },
  }
}

function errorResponse(status: number, data?: unknown) {
  return {
    ok: false as const,
    status,
    _data: data,
    headers: { get: () => null },
  }
}

function precognitionSuccessResponse() {
  return {
    ok: true as const,
    status: 204,
    _data: undefined,
    headers: {
      get: (name: string) =>
        name === 'Precognition' || name === 'Precognition-Success' ? 'true' : null,
    },
  }
}

function validationErrorResponse(errors: Record<string, string[]>) {
  return {
    ok: false as const,
    status: 422,
    _data: { errors },
    headers: {
      get: (name: string) => name === 'Precognition' ? 'true' : null,
    },
  }
}

function deferred<T = unknown>(): { promise: Promise<T>, resolve: (value: T) => void } {
  let resolve!: (value: T) => void

  const promise = new Promise<T>(
    (res) => {
      resolve = res
    },
  )

  return { promise, resolve }
}

function tick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('usePrecognitionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.raw.mockReset()
    useNuxtApp().$sanctumClient = mockClient as unknown as ReturnType<typeof useNuxtApp>['$sanctumClient']
  })

  describe('fields', () => {
    it('returns initial payload fields', () => {
      const form = createForm({ email: 'a@b.com', password: '', name: 'John' })

      expect(form.fields).toEqual({ email: 'a@b.com', password: '', name: 'John' })
    })
  })

  describe('errors', () => {
    it('starts with empty errors', () => {
      const form = createForm()

      expect(form.errors).toEqual({})
    })

    it('updates after setErrors', () => {
      const form = createForm()

      form.setErrors({ email: ['The email field is required.'] })

      expect(form.errors).toEqual({ email: ['The email field is required.'] })
    })

    it('keeps previous errors after forgetError', () => {
      const form = createForm()

      form.setErrors({ email: ['required'], password: ['too short'] })
      form.forgetError('email')

      expect(form.errors).toEqual({ password: ['too short'] })
    })

    it('replaces all errors on setErrors', () => {
      const form = createForm()

      form.setErrors({ email: ['required'] })
      form.setErrors({ password: ['too short'] })

      expect(form.errors).toEqual({ password: ['too short'] })
    })
  })

  describe('processing', () => {
    it('is false initially', () => {
      const form = createForm()

      expect(form.processing).toBe(false)
    })

    it('becomes true during submit and resets after', async () => {
      const { promise, resolve: resolveRaw } = deferred()

      mockClient
        .raw
        .mockReturnValue(promise)

      const form = createForm()
      const submitPromise = form.submit()

      expect(form.processing).toBe(true)

      resolveRaw(okResponse({ id: 1 }))
      await submitPromise

      expect(form.processing).toBe(false)
    })

    it('resets to false after failed submit', async () => {
      const responseMock = errorResponse(500)

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      await expect(form.submit()).rejects.toBeDefined()

      expect(form.processing).toBe(false)
    })
  })

  describe('validating', () => {
    it('is false initially', () => {
      const form = createForm()

      expect(form.validating).toBe(false)
    })

    it('becomes true during validate and resets after', async () => {
      const { promise, resolve: resolveRaw } = deferred()

      mockClient
        .raw
        .mockReturnValue(promise)

      const form = createForm()
      form.validate('email')

      expect(form.validating).toBe(true)

      resolveRaw(precognitionSuccessResponse())
      await tick()

      expect(form.validating).toBe(false)
    })
  })

  describe('hasErrors', () => {
    it('is false when no errors', () => {
      const form = createForm()

      expect(form.hasErrors).toBe(false)
    })

    it('is true when errors exist', () => {
      const form = createForm()

      form.setErrors({ email: ['required'] })

      expect(form.hasErrors).toBe(true)
    })

    it('becomes false after clearing errors', () => {
      const form = createForm()

      form.setErrors({ email: ['required'] })
      form.forgetError('email')

      expect(form.hasErrors).toBe(false)
    })

    it('becomes false after setErrors with empty object', () => {
      const form = createForm()

      form.setErrors({ email: ['required'] })
      form.setErrors({})

      expect(form.hasErrors).toBe(false)
    })
  })

  describe('isDirty', () => {
    it('is false initially', () => {
      const form = createForm()

      expect(form.isDirty).toBe(false)
    })

    it('is true after field change via setData', () => {
      const form = createForm()

      form.setData({ email: 'changed@test.com' })

      expect(form.isDirty).toBe(true)
    })

    it('is false after reset', () => {
      const form = createForm({ email: 'changed@test.com', password: '', name: '' })

      form.setData({ email: 'new@test.com' })
      form.reset()

      expect(form.isDirty).toBe(false)
    })
  })

  describe('wasSuccessful', () => {
    it('is false initially', () => {
      const form = createForm()

      expect(form.wasSuccessful).toBe(false)
    })

    it('becomes true after successful submit', async () => {
      const responseMock = okResponse({ id: 1 })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      await form.submit()

      expect(form.wasSuccessful).toBe(true)
    })

    it('becomes false after failed submit', async () => {
      const responseMock = errorResponse(422)

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      await form.submit().catch(() => { })

      expect(form.wasSuccessful).toBe(false)
    })
  })

  describe('recentlySuccessful', () => {
    it('is false initially', () => {
      const form = createForm()

      expect(form.recentlySuccessful).toBe(false)
    })

    it('becomes true after successful submit', async () => {
      const responseMock = okResponse({ id: 1 })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      await form.submit()

      expect(form.recentlySuccessful).toBe(true)
    })

    it('resets to false after 2 seconds', async () => {
      vi.useFakeTimers()

      const responseMock = okResponse({ id: 1 })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      await form.submit()

      expect(form.recentlySuccessful).toBe(true)

      vi.advanceTimersByTime(2000)

      expect(form.recentlySuccessful).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('touched', () => {
    it('returns false for untouched field', () => {
      const form = createForm()

      expect(form.touched('email')).toBe(false)
    })

    it('returns true after touch', () => {
      const form = createForm()

      form.touch('email')

      expect(form.touched('email')).toBe(true)
    })

    it('accepts array of field names', () => {
      const form = createForm()

      form.touch(['email', 'password'])

      expect(form.touched('email')).toBe(true)
      expect(form.touched('password')).toBe(true)
    })

    it('is cleared by field reset', () => {
      const form = createForm()

      form.touch('email')
      form.reset('email')

      expect(form.touched('email')).toBe(false)
    })

    it('is cleared by full reset', () => {
      const form = createForm()

      form.touch('email')
      form.reset()

      expect(form.touched('email')).toBe(false)
    })
  })

  describe('valid', () => {
    it('returns false for unvalidated field', () => {
      const form = createForm()

      expect(form.valid('email')).toBe(false)
    })

    it('returns false for field with errors after validation', async () => {
      const responseMock = validationErrorResponse({ email: ['The email field is required.'] })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      form.validate('email')

      await tick()

      expect(form.valid('email')).toBe(false)
    })

    it('returns true for field validated successfully', async () => {
      const responseMock = precognitionSuccessResponse()

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      form.validate('email')

      await tick()

      expect(form.valid('email')).toBe(true)
    })
  })

  describe('invalid', () => {
    it('returns false for field with no errors', () => {
      const form = createForm()

      expect(form.invalid('email')).toBe(false)
    })

    it('returns true for field with errors', () => {
      const form = createForm()

      form.setErrors({ email: ['required'] })

      expect(form.invalid('email')).toBe(true)
    })

    it('becomes false after forgetError', () => {
      const form = createForm()

      form.setErrors({ email: ['required'] })
      form.forgetError('email')

      expect(form.invalid('email')).toBe(false)
    })
  })

  describe('data', () => {
    it('returns all field values', () => {
      const form = createForm({ email: 'a@b.com', password: 'secret', name: '' })

      expect(form.data()).toEqual({ email: 'a@b.com', password: 'secret', name: '' })
    })

    it('returns values without reactive proxy', () => {
      const form = createForm({ email: 'a@b.com', password: '', name: '' })
      const raw = form.data()

      expect(isReactive(raw)).toBe(false)
    })
  })

  describe('setData', () => {
    it('updates specified fields', () => {
      const form = createForm()

      form.setData({ email: 'test@test.com', name: 'John' })

      expect(form.fields.email).toBe('test@test.com')
      expect(form.fields.name).toBe('John')
    })

    it('does not affect unspecified fields', () => {
      const form = createForm({ email: '', password: 'secret', name: 'John' })

      form.setData({ email: 'test@test.com' })

      expect(form.fields.password).toBe('secret')
      expect(form.fields.name).toBe('John')
    })

    it('returns form for chaining', () => {
      const form = createForm()

      const result = form.setData({ email: 'test@test.com' })

      expect(result).toBe(form)
    })
  })

  describe('touch', () => {
    it('marks single field as touched', () => {
      const form = createForm()

      form.touch('email')

      expect(form.touched('email')).toBe(true)
    })

    it('marks multiple fields as touched', () => {
      const form = createForm()

      form.touch(['email', 'password'])

      expect(form.touched('email')).toBe(true)
      expect(form.touched('password')).toBe(true)
    })

    it('deduplicates on repeated calls', () => {
      const form = createForm()

      form.touch('email')
      form.touch('email')

      expect(form.touched('email')).toBe(true)
    })

    it('returns form for chaining', () => {
      const form = createForm()

      const result = form.touch('email')

      expect(result).toBe(form)
    })
  })

  describe('reset', () => {
    it('resets all fields to original values when no keys given', () => {
      const form = createForm({ email: '', name: 'John', password: '' })

      form.setData({ email: 'changed@test.com', name: 'Jane' })
      form.reset()

      expect(form.fields.email).toBe('')
      expect(form.fields.name).toBe('John')
      expect(form.fields.password).toBe('')
    })

    it('resets specific fields when keys given', () => {
      const form = createForm({ email: '', name: 'John', password: '' })

      form.setData({ email: 'changed@test.com', name: 'Jane' })
      form.reset('email')

      expect(form.fields.email).toBe('')
      expect(form.fields.name).toBe('Jane')
    })

    it('clears errors for reset fields', () => {
      const form = createForm()

      form.setErrors({ email: ['required'], password: ['too short'] })
      form.reset('email')

      expect(form.errors.email).toBeUndefined()
      expect(form.errors.password).toBeDefined()
    })

    it('clears errors for all fields on full reset', () => {
      const form = createForm()

      form.setErrors({ email: ['required'], password: ['too short'] })
      form.reset()

      expect(form.errors).toEqual({})
    })

    it('clears touched state for reset fields', () => {
      const form = createForm()

      form.touch('email')
      form.touch('password')
      form.reset('email')

      expect(form.touched('email')).toBe(false)
      expect(form.touched('password')).toBe(true)
    })

    it('returns form for chaining', () => {
      const form = createForm()

      const result = form.reset()

      expect(result).toBe(form)
    })
  })

  describe('setErrors', () => {
    it('replaces current errors', () => {
      const form = createForm()

      form.setErrors({ email: ['required'] })

      expect(form.errors).toEqual({ email: ['required'] })
    })

    it('hasErrors becomes true after setting errors', () => {
      const form = createForm()

      form.setErrors({ email: ['required'] })

      expect(form.hasErrors).toBe(true)
    })

    it('returns form for chaining', () => {
      const form = createForm()

      const result = form.setErrors({ email: ['required'] })

      expect(result).toBe(form)
    })
  })

  describe('forgetError', () => {
    it('removes error for specific field', () => {
      const form = createForm()

      form.setErrors({ email: ['required'], password: ['too short'] })
      form.forgetError('email')

      expect(form.errors.email).toBeUndefined()
    })

    it('preserves other errors', () => {
      const form = createForm()

      form.setErrors({ email: ['required'], password: ['too short'] })
      form.forgetError('email')

      expect(form.errors.password).toEqual(['too short'])
    })

    it('updates hasErrors when last error removed', () => {
      const form = createForm()

      form.setErrors({ email: ['required'] })
      form.forgetError('email')

      expect(form.hasErrors).toBe(false)
    })

    it('returns form for chaining', () => {
      const form = createForm()

      const result = form.forgetError('email')

      expect(result).toBe(form)
    })
  })

  describe('validate', () => {
    it('sends precognitive request', async () => {
      const responseMock = precognitionSuccessResponse()

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      form.validate('email')
      await tick()

      // TODO: improve this assertion to check for precognition headers instead of just URL
      expect(mockClient.raw)
        .toHaveBeenCalledWith(
          ENDPOINT,
          expect.objectContaining({ headers: expect.any(Headers) }),
        )
    })

    it('sets errors on validation failure', async () => {
      const responseMock = validationErrorResponse({
        email: ['The email field is required.'],
        password: ['The password field is required.'],
      })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      form.validate()
      await tick()

      expect(form.errors.email).toEqual(['The email field is required.'])
      expect(form.errors.password).toEqual(['The password field is required.'])
    })

    it('clears errors on validation success', async () => {
      const responseMock = precognitionSuccessResponse()

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      form.setErrors({ email: ['old error'] })

      form.validate()
      await tick()

      expect(form.errors.email).toBeUndefined()
    })

    it('marks validated fields as valid', async () => {
      const responseMock = precognitionSuccessResponse()

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      form.validate('email')
      await tick()

      expect(form.valid('email')).toBe(true)
    })

    it('calls onSuccess callback on success', async () => {
      const responseMock = precognitionSuccessResponse()

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      const onSuccess = vi.fn()

      form.validate('email', { onSuccess })
      await tick()

      expect(onSuccess).toHaveBeenCalledOnce()
    })

    it('calls onValidationError callback on 422', async () => {
      const responseMock = validationErrorResponse({ email: ['required'] })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      const onValidationError = vi.fn()

      form.validate('email', { onValidationError })
      await tick()

      expect(onValidationError).toHaveBeenCalledOnce()
    })

    it('calls onError callback on non-422 error', async () => {
      const responseMock = errorResponse(500)

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      const onError = vi.fn()

      form.validate('email', { onError })
      await tick()

      expect(onError).toHaveBeenCalledOnce()
    })

    it('returns form for chaining', async () => {
      const responseMock = precognitionSuccessResponse()

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      const result = form.validate('email')

      expect(result).toBe(form)
    })

    it('validates all fields when called without name', async () => {
      const responseMock = precognitionSuccessResponse()

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      form.validate()
      await tick()

      // TODO: improve this assertion to check requested fields instead of just URL
      expect(mockClient.raw).toHaveBeenCalledWith(
        ENDPOINT,
        expect.anything(),
      )
    })

    it('sends header for partial field validation', async () => {
      const responseMock = precognitionSuccessResponse()

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      form.validate('email')
      await tick()

      // TODO: improve this assertion to check for precognition headers and requested fields instead of just URL
      expect(mockClient.raw)
        .toHaveBeenCalledWith(
          ENDPOINT,
          expect.objectContaining({ headers: expect.any(Headers) }),
        )
    })
  })

  describe('validateWithErrors', () => {
    it('returns empty object on success', async () => {
      const responseMock = precognitionSuccessResponse()

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      const errors = await form.validateWithErrors()

      expect(errors).toEqual({})
    })

    it('returns errors on validation failure', async () => {
      const responseMock = validationErrorResponse({ email: ['required'] })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      const errors = await form.validateWithErrors()

      expect(errors).toEqual({ email: ['required'] })
    })

    it('sets validating during the request', async () => {
      const { promise: clientPromise, resolve: resolveRaw } = deferred()

      mockClient
        .raw
        .mockReturnValue(clientPromise)

      const form = createForm()
      const promise = form.validateWithErrors()

      expect(form.validating).toBe(true)

      resolveRaw(precognitionSuccessResponse())
      await promise

      expect(form.validating).toBe(false)
    })
  })

  describe('submit', () => {
    it('sends non-precognitive request', async () => {
      const responseMock = okResponse({ id: 1 })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      await form.submit()

      // TODO: check the whole request options instead of just URL and method
      expect(mockClient.raw)
        .toHaveBeenCalledWith(
          ENDPOINT,
          expect.objectContaining({
            method: 'post',
            ignoreResponseError: true,
          }),
        )
    })

    it('sends POST data as body', async () => {
      const responseMock = okResponse({ id: 1 })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm({ email: 'test@test.com', password: 'secret', name: '' })
      await form.submit()

      // TODO: check the whole request options instead of just URL and method
      expect(mockClient.raw)
        .toHaveBeenCalledWith(
          ENDPOINT,
          expect.objectContaining({
            method: 'post',
            body: expect.anything(),
          }),
        )
    })

    it('sets processing during the request', async () => {
      const { promise, resolve: resolveRaw } = deferred()

      mockClient
        .raw
        .mockReturnValue(promise)

      const form = createForm()
      const submitPromise = form.submit()

      expect(form.processing).toBe(true)

      resolveRaw(okResponse({ id: 1 }))
      await submitPromise

      expect(form.processing).toBe(false)
    })

    it('sets wasSuccessful on success', async () => {
      const responseMock = okResponse({ id: 1 })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      await form.submit()

      expect(form.wasSuccessful).toBe(true)
    })

    it('sets recentlySuccessful on success', async () => {
      const responseMock = okResponse({ id: 1 })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      await form.submit()

      expect(form.recentlySuccessful).toBe(true)
    })

    it('returns response on success', async () => {
      const responseMock = okResponse({ id: 1 })

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      const result = await form.submit()

      expect(result).toBe(responseMock)
    })

    it('re-throws on failure', async () => {
      const responseMock = errorResponse(422)

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()

      await expect(form.submit()).rejects.toBeDefined()
    })

    it('sets wasSuccessful to false on failure', async () => {
      const responseMock = errorResponse(422)

      mockClient
        .raw
        .mockResolvedValue(responseMock)

      const form = createForm()
      await form.submit().catch(() => { })

      expect(form.wasSuccessful).toBe(false)
    })
  })
})
