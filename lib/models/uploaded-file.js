'use babel'

export default class UploadedFile {
  constructor(name, url, mimeType) {
    this.name = name
    this.url = url
    this.mimeType = mimeType
  }

  isImage() {
    return this.mimeType != null && this.mimeType.startsWith('image/')
  }

  getEncodedUrl() {
    return encodeURI(this.url)
  }
}
