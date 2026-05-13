import { describe, it, expect, vi, afterEach } from 'vitest'
import { isFile, hasFiles, clearFiles } from '../../../src/runtime/utils/files'

describe('files helper', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('isFile', () => {
    it('returns true when input is Blob', () => {
      const blob = new Blob(['test'], { type: 'text/plain' })

      expect(isFile(blob)).toBeTruthy()
    })

    it('returns true when input is File', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })

      expect(isFile(file)).toBeTruthy()
    })

    it('returns true when input is non-empty FileList', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })

      class FileListMock {
        length = 1
        0 = file
        item(index: number) { return index === 0 ? file : null }
        [index: number]: File | undefined
      }

      vi.stubGlobal('FileList', FileListMock as unknown as typeof FileList)

      const fileList = new FileListMock()

      expect(isFile(fileList)).toBeTruthy()
    })

    it('returns false when input is empty FileList', () => {
      class FileListMock {
        length = 0
        item() { return null }
      }

      vi.stubGlobal('FileList', FileListMock as unknown as typeof FileList)

      const fileList = new FileListMock()

      expect(isFile(fileList)).toBeFalsy()
    })

    it('returns false when FileList is undefined (non-browser runtime)', () => {
      vi.stubGlobal('FileList', undefined)

      expect(isFile({ length: 1 })).toBeFalsy()
    })

    it('returns false when input is not recognised', () => {
      expect(isFile('string')).toBeFalsy()
      expect(isFile(123)).toBeFalsy()
      expect(isFile(null)).toBeFalsy()
      expect(isFile(undefined)).toBeFalsy()
      expect(isFile({})).toBeFalsy()
      expect(isFile([])).toBeFalsy()
    })
  })

  describe('hasFiles', () => {
    it('returns true when input is File', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })

      expect(hasFiles(file)).toBeTruthy()
    })

    it('returns true when input is object with at least one file field', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const blob = new Blob(['test'], { type: 'text/plain' })

      expect(hasFiles({ avatar: file })).toBeTruthy()
      expect(hasFiles({ avatar: blob, name: 'John' })).toBeTruthy()
    })

    it('returns false when input is object with no file fields', () => {
      expect(hasFiles({ name: 'John', age: 30 })).toBeFalsy()
      expect(hasFiles({ nested: { foo: 'bar' } })).toBeFalsy()
    })

    it('returns false when input is not recognised', () => {
      expect(hasFiles('string')).toBeFalsy()
      expect(hasFiles(123)).toBeFalsy()
      expect(hasFiles(null)).toBeFalsy()
      expect(hasFiles(undefined)).toBeFalsy()
    })
  })

  describe('clearFiles', () => {
    it('removes file fields from object', () => {
      const obj = {
        name: 'John',
        file: new File(['test'], 'test.txt', { type: 'text/plain' }),
        age: 25,
      }

      expect(clearFiles(obj)).toEqual({ name: 'John', age: 25 })
    })

    it('removes file fields from nested objects recursively', () => {
      const obj = {
        user: {
          avatar: new File(['img'], 'img.png', { type: 'image/png' }),
          name: 'John',
        },
      }

      expect(clearFiles(obj)).toEqual({ user: { name: 'John' } })
    })

    it('removes file fields from nested arrays recursively', () => {
      const obj = {
        items: [
          { file: new File(['a'], 'a.txt', { type: 'text/plain' }), id: 1 },
          { file: new File(['b'], 'b.txt', { type: 'text/plain' }), id: 2 },
        ],
      }

      expect(clearFiles(obj)).toEqual({ items: [{ id: 1 }, { id: 2 }] })
    })

    it('preserves non-file objects unchanged', () => {
      const obj = { name: 'John', age: 30 }

      expect(clearFiles(obj)).toEqual({ name: 'John', age: 30 })
    })
  })
})
