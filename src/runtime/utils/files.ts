/**
 * Check if the given value is a File or a Blob.
 * @param value
 */
export const isFile = (value: unknown): boolean => (typeof File !== 'undefined' && value instanceof File)
  || value instanceof Blob
  || (typeof FileList !== 'undefined' && value instanceof FileList && value.length > 0)

/**
 * Check if the given data contains any files.
 * @param data
 */
export const hasFiles = (data: unknown): boolean => isFile(data)
  || (typeof data === 'object' && data !== null && Object.values(data).some(value => hasFiles(value)))

/**
 * Removes all files from the given data object recursively.
 * @param data
 */
export const clearFiles = (data: object): object => {
  let newData = { ...data } as Record<string, unknown>

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
        newData = fields

        return
      }

      // recursively clear files from nested arrays
      if (Array.isArray(value)) {
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
