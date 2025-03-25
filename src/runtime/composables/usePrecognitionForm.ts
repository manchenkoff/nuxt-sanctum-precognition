import { computed, reactive, type Ref, ref, toRaw } from 'vue'
import { cloneDeep, debounce, isEqual } from 'lodash'
import type {
  Payload,
  PayloadData,
  PayloadErrors,
  PayloadKey,
  PrecognitionForm,
  RequestMethod,
  ResponseType,
  ValidationOptions,
} from '../types'
import { usePrecognitionConfig } from '../composables/usePrecognitionConfig'
import { useSanctumClient } from '#imports'

const
  PRECOGNITION_HEADER = 'Precognition',
  PRECOGNITION_ONLY_HEADER = 'Precognition-Validate-Only',
  PRECOGNITION_SUCCESS_HEADER = 'Precognition-Success',
  CONTENT_TYPE_HEADER = 'Content-Type'

export const usePrecognitionForm = <T extends Payload>(
  method: RequestMethod,
  url: string,
  payload: T,
): PrecognitionForm<T> => {
  const _originalPayload: T = cloneDeep(payload)
  const _originalPayloadKeys: PayloadKey<T>[] = Object.keys(_originalPayload)

  const _payload = reactive<T>(payload)

  const _validated = ref<PayloadKey<T>[]>([]) as Ref<PayloadKey<T>[]>
  const _touched = ref<PayloadKey<T>[]>([]) as Ref<PayloadKey<T>[]>

  const _config = usePrecognitionConfig()
  const _client = useSanctumClient()

  const isFile = (value: unknown): boolean => (typeof File !== 'undefined' && value instanceof File)
    || value instanceof Blob
    || (typeof FileList !== 'undefined' && value instanceof FileList && value.length > 0)

  const hasFiles = (data: unknown): boolean => isFile(data)
    || (typeof data === 'object' && data !== null && Object.values(data).some(value => hasFiles(value)))

  const clearFiles = <T extends Payload>(data: T): T => {
    let newData = { ...data }

    Object
      .keys(newData)
      .forEach((name) => {
        const value = newData[name]

        if (value === null) {
          return
        }

        // drop the file from the payload
        if (isFile(value)) {
          const { [name]: _, ...fields } = newData
          newData = fields as T

          return
        }

        // recursively clear files from nested arrays
        if (Array.isArray(value)) {
          // @ts-expect-error: assign property value on reactive object
          newData[name] = Object.values(clearFiles({ ...value }))

          return
        }

        // recursively clear files from nested objects
        if (typeof value === 'object') {
          // @ts-expect-error: assign property value on reactive object
          newData[name] = clearFiles(newData[name])

          return
        }
      })

    return newData
  }

  async function process(params: { precognitive: boolean, fields: PayloadKey<T>[], options?: ValidationOptions } = { precognitive: false, fields: [], options: {} }): Promise<ResponseType> {
    let payload = form.data()

    const headers = new Headers()
    const includeFiles = params.options?.validateFiles ?? _config.validateFiles

    if (hasFiles(payload)) {
      if (includeFiles) {
        headers.set(CONTENT_TYPE_HEADER, 'multipart/form-data')
      }
      else {
        console.warn('Files were detected in the payload but will not be sent. '
          + 'To include files, set `validateFiles` to `true` in the validation options or module config.')
        payload = clearFiles(payload)
      }
    }

    if (params.precognitive) {
      headers.set(PRECOGNITION_HEADER, 'true')

      if (params.fields.length > 0 && params.fields.length !== _originalPayloadKeys.length) {
        headers.set(PRECOGNITION_ONLY_HEADER, params.fields.join())
      }
    }

    const response = await _client.raw(url, {
      method: method,
      ...(
        ['get', 'delete'].includes(method)
          ? { query: payload } // GET, DELETE
          : { body: payload } // POST, PUT, PATCH
      ),
      headers,
      ignoreResponseError: true,
    })

    if (params.precognitive) {
      if (response.headers.get(PRECOGNITION_HEADER) !== 'true') {
        console.warn('Did not receive a Precognition response. Ensure you have the Precognition middleware in place for the route.')
      }

      if (response.status === 204 && response.headers.get(PRECOGNITION_SUCCESS_HEADER) === 'true') {
        if (params.fields.length > 0) {
          const validatedNew = new Set(_validated.value)

          params.fields.forEach((field) => {
            validatedNew.add(field)
            form.forgetError(field)
          })

          _validated.value = [...validatedNew]
        }
        else {
          _validated.value = _originalPayloadKeys
          form.setErrors({})
        }
      }
    }

    if (response.ok) {
      return Promise.resolve(response)
    }

    if (response.status === 422) {
      form.setErrors(response._data.errors as PayloadErrors<T>)
    }

    return Promise.reject(response)
  }

  const form: PrecognitionForm<T> = {
    fields: _payload,
    errors: ref<PayloadErrors<T>>({}) as Ref<PayloadErrors<T>>,

    processing: ref(false),
    validating: ref(false),
    hasErrors: computed(() => Object.keys(form.errors.value).length > 0),

    touched: (name: PayloadKey<T>): boolean => _touched.value.includes(name),
    valid: (name: PayloadKey<T>): boolean => _validated.value.includes(name) && !form.invalid(name),
    invalid: (name: PayloadKey<T>): boolean => typeof form.errors.value[name] !== 'undefined',

    data(): T {
      return toRaw(_payload) as T
    },

    setData(data: PayloadData<T>): PrecognitionForm<T> {
      Object
        .keys(data)
        .forEach((key: PayloadKey<T>) => {
          // @ts-expect-error: assign property value on reactive object
          _payload[key] = data[key]
        })

      return form
    },

    touch(name: PayloadKey<T> | Array<PayloadKey<T>>): PrecognitionForm<T> {
      const inputs = Array.isArray(name) ? name : [name]
      const fields = [..._touched.value, ...inputs]

      const newTouched = [...new Set(fields)]

      const hasNewFields
        = newTouched.length !== _touched.value.length
          || newTouched.every(x => _touched.value.includes(x))

      if (hasNewFields) {
        _touched.value = newTouched
      }

      return form
    },

    reset(...keys: PayloadKey<T>[]): PrecognitionForm<T> {
      const resetField = (fieldName: string) => {
        // @ts-expect-error: assign property value on reactive object
        _payload[fieldName] = _originalPayload[fieldName]
        form.forgetError(fieldName)
      }

      if (keys.length === 0) {
        _originalPayloadKeys.forEach(name => resetField(name))
        _touched.value = []
        _validated.value = []
      }

      const newTouched = [..._touched.value]
      const newValidated = [..._validated.value]

      keys.forEach((name) => {
        resetField(name)

        if (newTouched.includes(name)) {
          newTouched.splice(newTouched.indexOf(name), 1)
        }

        if (newValidated.includes(name)) {
          newValidated.splice(newValidated.indexOf(name), 1)
        }
      })

      _touched.value = newTouched
      _validated.value = newValidated

      return form
    },

    setErrors(entries: PayloadErrors<T>): PrecognitionForm<T> {
      if (!isEqual(form.errors.value, entries)) {
        form.errors.value = entries
      }

      return form
    },

    forgetError(name: PayloadKey<T>): PrecognitionForm<T> {
      const {
        [name]: _,
        ...newErrors
      } = form.errors.value

      return form.setErrors(newErrors as PayloadErrors<T>)
    },

    validate(name?: PayloadKey<T> | Array<PayloadKey<T>>, options?: ValidationOptions): PrecognitionForm<T> {
      if (typeof name === 'undefined') {
        name = []
      }

      const fields = Array.isArray(name) ? name : [name]

      form.validating.value = true

      process({ precognitive: true, fields, options })
        .then((response: ResponseType) => {
          if (!options?.onSuccess) {
            return
          }

          options.onSuccess(response)
        })
        .catch((response: ResponseType) => {
          if (response.status === 422) {
            if (!options?.onValidationError) {
              return
            }

            options.onValidationError(response)
            return
          }

          if (!options?.onError) {
            return
          }

          options.onError(response)
        })
        .finally(() => form.validating.value = false)

      return form
    },

    async submit(): Promise<ResponseType> {
      form.processing.value = true

      return await process()
        .finally(() => form.processing.value = false)
    },
  }

  form.validate = debounce(form.validate, _config.validationTimeout) as typeof form.validate

  return form
}
