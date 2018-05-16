'use babel';

/* global atom */

import { CompositeDisposable } from 'atom';
import S3Client from './services/s3client';
import ProgressModalView from './views/progress-modal-view'

export default {
  config: {
    s3BucketName: {
      title: 'S3 bucket name (* required)',
      type: 'string',
      default: '',
      order: 1,
    },
    s3BucketCustomUrl: {
      title: 'S3 bucket custom URL (If you wanna replace default one)',
      type: 'string',
      default: '',
      order: 2,
    },
    s3DirectoryPath: {
      title: 'S3 directory path',
      type: 'string',
      default: '',
      order: 3,
    },
    useUuidAsFileName: {
      title: 'Use UUID as upload file name.',
      type: 'boolean',
      default: true,
      order: 4,
    },
    markdownListingCharacter: {
      title: 'Listing character of Markdown when uploading multiple files',
      type: 'string',
      default: '-',
      order: 5,
    },
  },

  subscriptions: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.workspace.observeTextEditors(textEditor => {
        const textEditorElement = atom.views.getView(textEditor)
        textEditorElement.addEventListener('drop', event => {
          event.preventDefault()
          event.stopPropagation()

          const scope = textEditor.getRootScopeDescriptor()
          const { files } = event.dataTransfer
          const { modalView, modalPanel: progressModal } = this.showProgressModal()
          const markdownListingCharacter = atom.config.get('s3uploader.markdownListingCharacter')

          this.uploadDropedFilesToMarkdownTags(files).then(tags => {
            tags.forEach((tag, index) => {
              if (tags.length > 1) {
                // Use list when uploaded multiple files.
                if (index > 0) {
                  textEditor.insertText('\n')
                }
                textEditor.insertText(`${markdownListingCharacter} `)
              }

              textEditor.insertText(tag)
            })

            if (progressModal) progressModal.destroy()
          }).catch(error => {
            atom.notifications.addError(`Something went wrong: ${error}`)
            console.error(error)
            if (progressModal) progressModal.destroy()
          })
        })
      })
    )
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  showProgressModal(title = 'Now Processing', message = 'Please wait for the process finished...') {
    const modalView = new ProgressModalView({ title, message })
    const modalPanel = atom.workspace.addModalPanel({ item: modalView.getElement() })
    return { modalView, modalPanel }
  },

  async uploadDropedFilesToMarkdownTags(files) {
    const s3client = new S3Client()
    const s3BucketName = atom.config.get('s3uploader.s3BucketName')
    const s3BucketCustomUrl = atom.config.get('s3uploader.s3BucketCustomUrl')
    const s3DirectoryPath = atom.config.get('s3uploader.s3DirectoryPath')
    const useUuidAsFileName = atom.config.get('s3uploader.useUuidAsFileName')

    if (!s3BucketName) throw new Error('S3 Bucket Name should be specified in settings.')

    const s3BucketAvailable = await s3client.checkS3BucketAvailable(s3BucketName)
    const s3BucketLocation = await s3client.getS3BucketLocation(s3BucketName)

    const uploadPromises = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const promise = s3client.upload(s3BucketName, s3DirectoryPath, file, useUuidAsFileName).then(s3Path => {
        let url = `https://s3.${s3BucketLocation}.amazonaws.com/${s3BucketName}/${s3Path}`
        if (s3BucketCustomUrl) {
          url = `${s3BucketCustomUrl}/${s3Path}`
        }
        console.log(`File uploaded to ${url}.`)
        if (file.type != null && file.type.startsWith('image/')) {
          return `![${file.name}](${encodeURI(url)})`
        }
        return `[${file.name}](${encodeURI(url)})`
      })
      uploadPromises.push(promise)
    }
    return Promise.all(uploadPromises)
  }
}
