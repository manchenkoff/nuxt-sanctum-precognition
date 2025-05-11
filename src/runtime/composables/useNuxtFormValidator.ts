import type { Payload, PrecognitionForm } from '../types'

export interface FormError<P extends string = string> {
  name?: P
  message: string
}

export const useNuxtFormValidator = <T extends Payload>(form: PrecognitionForm<T>) => {
  async function validate() {
    const apiErrors = await form.validateWithErrors()
    const errors: FormError[] = []

    for (const [fieldName, fieldErrors] of Object.entries(apiErrors)) {
      if (fieldErrors === undefined || fieldErrors.length === 0) {
        continue
      }

      const message = fieldErrors[0]

      if (message === undefined) {
        continue
      }

      errors.push({
        name: fieldName,
        message,
      })
    }

    return errors
  }

  return validate
}
