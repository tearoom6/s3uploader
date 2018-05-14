'use babel';

/* global atom */

import { CompositeDisposable } from 'atom';

export default {
  config: {
    markdownListingCharacter: {
      title: 'Listing character of Markdown when uploading multiple files',
      type: 'string',
      default: '-',
      order: 1,
    },
  },

  subscriptions: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.workspace.observeTextEditors(textEditor => {
        const textEditorElement = atom.views.getView(textEditor)
        textEditorElement.addEventListener('drop', event => {
          const markdownListingCharacter = atom.config.get('s3uploader.markdownListingCharacter')
          const scope = textEditor.getRootScopeDescriptor()
          const { files } = event.dataTransfer
          for (let i = 0; i < files.length; i++) {
            event.preventDefault()
            event.stopPropagation()

            const file = files[i]
            const url = this.upload(file)

            if (files.length > 1) {
              // Use list when uploaded multiple files.
              if (i > 0) {
                textEditor.insertText('\n')
              }
              textEditor.insertText(`${markdownListingCharacter} `)
            }

            if (file.type != null && file.type.startsWith('image/')) {
              textEditor.insertText(`![${file.name}](${url})`)
            } else {
              textEditor.insertText(`[${file.name}](${url})`)
            }
          }
        })
      })
    )
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  upload(file) {
    console.log(`S3uploader start uploading: ${file.path}`)
    return 'https://test.com/result'
  }
}
