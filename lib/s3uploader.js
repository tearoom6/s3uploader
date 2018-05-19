'use babel'

import { CompositeDisposable } from 'atom'
import { clipboard } from 'electron'
import path from 'path'
import Config from './configs/config'
import S3Client from './services/s3client'
import ProgressModalView from './views/progress-modal-view'
import LoadedFile from './models/loaded-file'
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
    this.subscriptions = new CompositeDisposable()

    // Register commands.
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        's3uploader:openSettingsView': event => {
          this.openSettingsView(event)
        },
      })
    )

    this.subscriptions.add(
      atom.workspace.observeTextEditors(textEditor => {
        const textEditorElement = atom.views.getView(textEditor)
        // by drag & drop.
        textEditorElement.addEventListener('drop', event => {
          event.preventDefault()
          event.stopPropagation()

          const scope = textEditor.getRootScopeDescriptor()
          const { files } = event.dataTransfer
          this.loadDroppedFiles(files).then(loadedFiles => {
            this.uploadFilesAndWriteLinks(loadedFiles, textEditor)
          })
        })

        // by copy & paste.
        textEditorElement.addEventListener('keydown', event => {
          if (!(event.metaKey && event.keyCode === 86)) return // Only detect Cmd-v

          const fileName = clipboard.readText()
          const image = clipboard.readImage()
          if (image.isEmpty()) return // Only support image upload.

          const mimeType = image.toDataURL().match(/^data:([\w/]+);/)[1]
          if (!mimeType) return // Not found MIMEType.

          const extension = path.extname(fileName)
          let fileBody = null
          switch (extension) {
            case '.jpg':
            case '.jpeg':
              fileBody = clipboard.readImage().toJpeg(100)
              break
            case '.png':
              fileBody = clipboard.readImage().toPng()
              break
            default:
              return // Not supported format.
          }

          event.preventDefault()
          event.stopPropagation()

          const scope = textEditor.getRootScopeDescriptor()
          const files = [new LoadedFile(fileBody, fileName, mimeType)]
          this.uploadFilesAndWriteLinks(files, textEditor)
        })
      })
    )
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  async loadDroppedFiles(droppedFiles) {
    const promises = []
    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i]
      const promise = LoadedFile.buildByFilePath(file.path, file.name, file.type)
      promises.push(promise)
    }
    return Promise.all(promises)
  },

  uploadFilesAndWriteLinks(loadedFiles, textEditor) {
    const { modalView, modalPanel: progressModal } = this.showProgressModal()

    this.uploadFiles(loadedFiles).then(uploadedFiles => {
      const writer = WriterFactory.buildWriter(textEditor)
      writer.writeLinks(uploadedFiles)
      if (progressModal) progressModal.destroy()
    }).catch(error => {
      atom.notifications.addError(`Something went wrong: ${error}`)
      console.error(error)
      if (progressModal) progressModal.destroy()
    })
  },

  showProgressModal(title = 'Now Processing', message = 'Please wait for the process finished...') {
    const modalView = new ProgressModalView({ title, message })
    const modalPanel = atom.workspace.addModalPanel({ item: modalView.getElement() })
    return { modalView, modalPanel }
  },

  async uploadFiles(loadedFiles) {
    const config = new Config()
    if (!config.s3BucketName) throw new Error('S3 Bucket Name should be specified in settings.')

    const s3client = new S3Client()
    const uploadPromises = loadedFiles.map(loadedFile => s3client.upload(loadedFile))
    return Promise.all(uploadPromises)
  },

  openSettingsView(event) {
    atom.workspace.open('atom://config/packages/s3uploader', { pending: false })
    return true
  }
}
