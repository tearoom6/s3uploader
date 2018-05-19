'use babel'

/* global atom */

import fs from 'fs'

export default class LoadedFile {
  static async buildByFilePath(path, name, mimeType) {
    const body = await LoadedFile.loadBodyByPath(path)
    return new LoadedFile(body, name, mimeType)
  }

  constructor(body, name, mimeType) {
    this.body = body
    this.name = name
    this.mimeType = mimeType
  }

  static async loadBodyByPath(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (readError, fileBody) => {
        if (readError) {
          reject(readError)
          return
        }
        resolve(fileBody)
      })
    })
  }
}
