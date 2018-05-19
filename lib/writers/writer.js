'use babel'

export default class Writer {
  constructor(textEditor) {
    this.textEditor = textEditor
  }

  writeLinks(uploadedFiles) {
    throw new Error('Not implemented.')
  }

  writeLink(uploadedFile) {
    throw new Error('Not implemented.')
  }
}
