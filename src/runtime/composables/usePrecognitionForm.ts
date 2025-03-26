import { computed, reactive, type Ref, ref, toRaw } from 'vue'
import { cloneDeep, debounce, isEqual } from 'lodash'
import { objectToFormData } from 'object-form-encoder'
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
import {
  PRECOGNITION_HEADER,
  PRECOGNITION_ONLY_HEADER,
  PRECOGNITION_SUCCESS_HEADER,
  STATUS_NO_CONTENT,
  STATUS_VALIDATION_ERROR,
} from '../utils/constants'
import { clearFiles, hasFiles } from '../utils/files'
import { useSanctumClient } from '#imports'

type FormProcessParams<T extends Payload> = {
  precognitive: boolean
  fields: PayloadKey<T>[]
  options?: ValidationOptions
}

// TODO: implement a Nuxt UI compatible version of this composable (via decorator?)
export const usePrecognitionForm = <T extends Payload>(
  method: RequestMethod,
  url: string,
  payload: T,
): PrecognitionForm<T> => {
  const _originalPayload: T = cloneDeep(payload)
  const _originalPayloadKeys: PayloadKey<T>[] = Object.keys(_originalPayload)

  const _payload = reactive<T>(payload)
  const _errors = reactive<PayloadErrors<T>>({})

  const _validated = ref<PayloadKey<T>[]>([]) as Ref<PayloadKey<T>[]>
  const _touched = ref<PayloadKey<T>[]>([]) as Ref<PayloadKey<T>[]>

  const _config = usePrecognitionConfig()
  const _client = useSanctumClient()

  // TODO: refactor and decompose this function (separate current state and arguments)
  async function process(params: FormProcessParams<T> = {
    precognitive: false,
    fields: [],
    options: {},
  }): Promise<ResponseType> {
    let payload = form.data() as object

    const headers = new Headers()
    const includeFiles = params.options?.validateFiles ?? _config.validateFiles

    if (hasFiles(payload)) {
      if (params.precognitive && !includeFiles) {
        console.warn('Files were detected in the payload but will not be sent. '
          + 'To include files, set `validateFiles` to `true` in the validation options or module config.')
        payload = clearFiles(payload)
      }
      else {
        payload = objectToFormData(payload)
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

      if (
        response.status === STATUS_NO_CONTENT
        && response.headers.get(PRECOGNITION_SUCCESS_HEADER) === 'true'
      ) {
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

    if (response.status === STATUS_VALIDATION_ERROR) {
      form.setErrors(response._data.errors as PayloadErrors<T>)
    }

    return Promise.reject(response)
  }

  const form: PrecognitionForm<T> = {
    fields: _payload,
    errors: _errors,

    // TODO: make them accessible without '.value', use reactive() & PrecognitionForm<T> on the 'form' object
    processing: ref(false),
    validating: ref(false),
    hasErrors: computed(() => Object.keys(form.errors).length > 0),

    touched: (name: PayloadKey<T>): boolean => _touched.value.includes(name),
    valid: (name: PayloadKey<T>): boolean => _validated.value.includes(name) && !form.invalid(name),
    invalid: (name: PayloadKey<T>): boolean => typeof (form.errors as PayloadErrors<T>)[name] !== 'undefined',

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
      if (!isEqual(form.errors, entries)) {
        form.errors = reactive(entries)
      }

      return form
    },

    forgetError(name: PayloadKey<T>): PrecognitionForm<T> {
      const {
        [name]: _,
        ...newErrors
      } = form.errors as PayloadErrors<T>

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
          if (response.status === STATUS_VALIDATION_ERROR) {
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
