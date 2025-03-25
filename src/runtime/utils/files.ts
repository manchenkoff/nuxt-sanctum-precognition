import type { Payload } from '../types'

export const isFile = (value: unknown): boolean => (typeof File !== 'undefined' && value instanceof File)
  || value instanceof Blob
  || (typeof FileList !== 'undefined' && value instanceof FileList && value.length > 0)

export const hasFiles = (data: unknown): boolean => isFile(data)
  || (typeof data === 'object' && data !== null && Object.values(data).some(value => hasFiles(value)))

export const clearFiles = <T extends Payload>(data: T): T => {
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
