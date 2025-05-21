import type { FetchResponse } from 'ofetch'

export interface ModuleOptions {
  /**
   * Whether to send files when validating the form on every request.
   * @default false
   */
  validateFiles: boolean
  /**
   * The duration in milliseconds to wait before validating the form.
   * @default 500
   */
  validationTimeout: number
  /**
   * The log level to use for the logger.
   *
   * 0: Fatal and Error
   * 1: Warnings
   * 2: Normal logs
   * 3: Informational logs
   * 4: Debug logs
   * 5: Trace logs
   *
   * More details at https://github.com/unjs/consola?tab=readme-ov-file#log-level
   * @default 3
   */
  logLevel: number
}

/**
 * The payload object that represents the form data.
 */
export type Payload = Record<string, unknown>
/**
 * The key of the payload object.
 */
export type PayloadKey<T extends Payload> = keyof T & string
/**
 * Object type of the payload instance (key-value pairs).
 */
export type PayloadData<T extends Payload> = Record<PayloadKey<T>, unknown>
/**
 * Dictionary of errors for each payload key.
 */
export type PayloadErrors<T extends Payload> = Partial<Record<PayloadKey<T>, string[]>>

/**
 * The request method to use for the form submission.
 */
export type RequestMethod = 'get' | 'post' | 'patch' | 'put' | 'delete'
/**
 * The response type for the form submission.
 */
export type ResponseType = FetchResponse<unknown>

/**
 * The options for validating the form.
 */
export type ValidationOptions = {
  /**
   * Whether to validate files in the payload.
   * If set to `true`, files will be included in the validation.
   * Otherwise, files will be removed before sending the request.
   */
  validateFiles?: boolean
  /**
   * A callback function to execute when the form submission is successful.
   * @param response The HTTP response from the server.
   */
  onSuccess?: (response: ResponseType) => void
  /**
   * A callback function to execute when the form submission fails.
   * @param error The Error instance or HTTP response from the server.
   */
  onError?: (error: Error | ResponseType) => void
  /**
   * A callback function to execute when the form validation fails.
   * @param response The HTTP response from the server.
   */
  onValidationError?: (response: ResponseType) => void
}

/**
 * The form type for precognitive validation.
 */
export interface PrecognitionForm<T extends Payload> {
  /**
   * Values of the form fields.
   */
  fields: T
  /**
   * Errors for each form field.
   */
  errors: PayloadErrors<T>

  /**
   * Whether the form is currently processing a submission request.
   */
  processing: boolean
  /**
   * Whether the form is currently validating the fields.
   */
  validating: boolean
  /**
   * Whether the form has any errors.
   */
  hasErrors: boolean
  /**
   * Becomes true when a form has been successfully submitted.
   */
  wasSuccessful: boolean
  /**
   * Becomes true for two seconds after a successful form submission.
   * This property can be used to show temporary success messages.
   */
  recentlySuccessful: boolean

  /**
   * Checks if a form field has been touched.
   * @param name The name of the form field.
   */
  touched(name: PayloadKey<T>): boolean

  /**
   * Checks if a form field is valid.
   * @param name The name of the form field.
   */
  valid(name: PayloadKey<T>): boolean

  /**
   * Checks if a form field is invalid.
   * @param name The name of the form field.
   */
  invalid(name: PayloadKey<T>): boolean

  /**
   * Gets the value of a form field.
   */
  data(): T

  /**
   * Sets a new value for the form fields.
   * @param data Record of key-value pairs for the form fields.
   */
  setData(data: Partial<PayloadData<T>>): PrecognitionForm<T>

  /**
   * Marks a form field as touched.
   * @param name The name of the form field.
   */
  touch(name: PayloadKey<T> | Array<PayloadKey<T>>): PrecognitionForm<T>

  /**
   * Resets the form fields to their original values.
   * @param keys The names of the form fields to reset.
   */
  reset(...keys: PayloadKey<T>[]): PrecognitionForm<T>

  /**
   * Sets the errors for the form fields.
   * @param entries Dictionary of errors for each payload key
   */
  setErrors(entries: PayloadErrors<T>): PrecognitionForm<T>

  /**
   * Clears the error for a form field.
   * @param name The name of the form field.
   */
  forgetError(name: PayloadKey<T>): PrecognitionForm<T>

  /**
   * Triggers the validation of the form fields.
   * @param name The name of the form field to validate (or an array of names).
   * @param options The options for validating the form.
   */
  validate(name?: PayloadKey<T> | Array<PayloadKey<T>>, options?: ValidationOptions): PrecognitionForm<T>

  /**
   * Triggers the validation of the form fields and returns the error map.
   */
  validateWithErrors(): Promise<PayloadErrors<T>>

  /**
   * Trigger the submission of the form.
   */
  submit(): Promise<ResponseType>
}
