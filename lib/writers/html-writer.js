'use babel'

/* global atom */

import UploadedFile from '../models/uploaded-file'
import Writer from './writer'

export default class HtmlWriter extends Writer {
  writeLinks(uploadedFiles) {
    uploadedFiles.forEach((uploadedFile, index) => {
      if (index > 0) {
        this.textEditor.insertText('\n')
      }
      this.writeLink(uploadedFile)
    })
  }

  writeLink(uploadedFile) {
    this.textEditor.insertText(HtmlWriter.composeOutputText(uploadedFile))
  }

  static composeOutputText(uploadedFile) {
    if (uploadedFile.isImage()) {
      return `<img src="${uploadedFile.getEncodedUrl()}" alt="${uploadedFile.name}" />`
    }
    return `<a href="${uploadedFile.getEncodedUrl()}">${uploadedFile.name}</a>`
  }
}
