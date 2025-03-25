import type { ComputedRef, Reactive, Ref } from 'vue'
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

export type Payload = Record<string, unknown>
export type PayloadKey<T extends Payload> = keyof T & string
export type PayloadData<T extends Payload> = Record<PayloadKey<T>, unknown>
export type PayloadErrors<T extends Payload> = Partial<Record<PayloadKey<T>, string[]>>

export type RequestMethod = 'get' | 'post' | 'patch' | 'put' | 'delete'
export type ResponseType = FetchResponse<unknown>

export type ValidationOptions = {
  validateFiles?: boolean
  onSuccess?: (response: ResponseType) => void
  onError?: (error: Error | ResponseType) => void
  onValidationError?: (response: ResponseType) => void
}

export interface PrecognitionForm<T extends Payload> {
  fields: Reactive<T>
  errors: Reactive<PayloadErrors<T>>

  processing: Ref<boolean>
  validating: Ref<boolean>
  hasErrors: ComputedRef<boolean>

  touched(name: PayloadKey<T>): boolean
  valid(name: PayloadKey<T>): boolean
  invalid(name: PayloadKey<T>): boolean

  data(): T
  setData(data: PayloadData<T>): PrecognitionForm<T>

  touch(name: PayloadKey<T> | Array<PayloadKey<T>>): PrecognitionForm<T>
  reset(...keys: PayloadKey<T>[]): PrecognitionForm<T>

  setErrors(entries: PayloadErrors<T>): PrecognitionForm<T>
  forgetError(name: PayloadKey<T>): PrecognitionForm<T>

  validate(name?: PayloadKey<T> | Array<PayloadKey<T>>, options?: ValidationOptions): PrecognitionForm<T>
  submit(): Promise<ResponseType>
}
