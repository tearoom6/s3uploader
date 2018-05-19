'use babel'

export default class Config {
  constructor() {
    // Make it singleton.
    // [JavaScript Design Patterns: The Singleton — SitePoint](https://www.sitepoint.com/javascript-design-patterns-singleton/)
    if (!Config.instance) {
      this.s3BucketName = atom.config.get('s3uploader.s3BucketName')
      this.s3BucketCustomUrl = atom.config.get('s3uploader.s3BucketCustomUrl')
      this.s3DirectoryPath = atom.config.get('s3uploader.s3DirectoryPath')
      this.useUuidAsFileName = atom.config.get('s3uploader.useUuidAsFileName')
      this.markdownListingCharacter = atom.config.get('s3uploader.markdownListingCharacter')
      Config.instance = this
    }

    return Config.instance
  }
}
