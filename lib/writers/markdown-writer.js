'use babel'

/* global atom */

import Config from '../configs/config'
import UploadedFile from '../models/uploaded-file'
import Writer from './writer'

export default class MarkdownWriter extends Writer {
  constructor(textEditor) {
    super(textEditor)
    this.config = new Config()
  }

  writeLinks(uploadedFiles) {
    uploadedFiles.forEach((uploadedFile, index) => {
      if (uploadedFiles.length > 1) {
        // Use list when uploaded multiple files.
        if (index > 0) {
          this.textEditor.insertText('\n')
        }
        this.textEditor.insertText(`${this.config.markdownListingCharacter} `)
      }

      this.writeLink(uploadedFile)
    })
  }

  writeLink(uploadedFile) {
    this.textEditor.insertText(MarkdownWriter.composeOutputText(uploadedFile))
  }

  static composeOutputText(uploadedFile) {
    if (uploadedFile.isImage()) {
      return `![${uploadedFile.name}](${uploadedFile.getEncodedUrl()})`
    }
    return `[${uploadedFile.name}](${uploadedFile.getEncodedUrl()})`
  }
}
