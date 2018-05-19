'use babel';

/* global atom */

import { CompositeDisposable } from 'atom';
import S3Client from './services/s3client';
import ProgressModalView from './views/progress-modal-view'
import UploadedFile from './models/uploaded-file'
import WriterFactory from './writers/writer-factory'

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

          this.uploadDropedFiles(files).then(uploadedFiles => {
            const writer = WriterFactory.buildWriter(textEditor)
            writer.writeLinks(uploadedFiles)
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

  async uploadDropedFiles(files) {
    const s3BucketName = atom.config.get('s3uploader.s3BucketName')
    const s3BucketCustomUrl = atom.config.get('s3uploader.s3BucketCustomUrl')
    const s3DirectoryPath = atom.config.get('s3uploader.s3DirectoryPath')
    const useUuidAsFileName = atom.config.get('s3uploader.useUuidAsFileName')

    if (!s3BucketName) throw new Error('S3 Bucket Name should be specified in settings.')

    const s3client = new S3Client()
    const uploadPromises = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const promise = s3client.upload(
        s3BucketName,
        s3DirectoryPath,
        file.name,
        file.path,
        file.type,
        useUuidAsFileName
      )
      uploadPromises.push(promise)
    }
    return Promise.all(uploadPromises)
  }
}
