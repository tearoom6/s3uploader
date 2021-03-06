'use babel'

import AWS from 'aws-sdk'
import path from 'path'
import uuidv4 from 'uuid/v4'
import Config from '../configs/config'
import LoadedFile from '../models/loaded-file'
import UploadedFile from '../models/uploaded-file'

export default class S3Client {
  constructor() {
    this.config = new Config()

    const {
      s3PlatformUrl, s3AccessKeyId, s3SecretAccessKey,
    } = this.config
    this.s3 = new AWS.S3({
      endpoint: s3PlatformUrl || null,
      accessKeyId: s3AccessKeyId || null,
      secretAccessKey: s3SecretAccessKey || null,
    })
  }

  async upload(loadedFile) {
    const {
      s3BucketName, s3DirectoryPath, useUuidAsFileName, s3BucketCustomUrl, s3PlatformUrl,
    } = this.config
    const s3BucketAvailable = await this.checkS3BucketAvailable(s3BucketName)
    const s3BucketLocation = await this.getS3BucketLocation(s3BucketName)

    console.log(`S3uploader start uploading: ${loadedFile.name} (${loadedFile.mimeType})`)
    return new Promise((resolve, reject) => {
      let s3Path = path.join(s3DirectoryPath, loadedFile.name)
      if (useUuidAsFileName) {
        const extension = path.extname(loadedFile.name)
        s3Path = path.join(s3DirectoryPath, `${uuidv4()}${extension}`)
      }
      const params = {
        Bucket: s3BucketName,
        Key: s3Path,
        Body: loadedFile.body,
        ContentType: loadedFile.mimeType,
        ACL: 'public-read'
      }
      this.s3.putObject(params, (error, data) => {
        if (error) {
          reject(error)
          return
        }
        let url = `https://s3.${s3BucketLocation}.amazonaws.com/${s3BucketName}/${s3Path}`
        if (s3PlatformUrl) {
          url = `${s3PlatformUrl}/${s3BucketName}/${s3Path}`
        }
        if (s3BucketCustomUrl) {
          url = `${s3BucketCustomUrl}/${s3Path}`
        }
        console.log(`File uploaded to ${url}.`)
        resolve(new UploadedFile(loadedFile.name, url, loadedFile.mimeType))
      })
    })
  }

  async checkS3BucketAvailable(s3BucketName) {
    return new Promise((resolve, reject) => {
      this.s3.waitFor('bucketExists', {
        Bucket: s3BucketName,
        $waiter: { delay: 0.1, maxAttempts: 2 },
      }, (error, data) => {
        if (error) {
          reject(error)
          return
        }
        if (!data) {
          reject(new Error(`Bucket not found: ${s3BucketName}`))
          return
        }
        resolve(true)
      })
    })
  }

  async getS3BucketLocation(s3BucketName) {
    return new Promise((resolve, reject) => {
      this.s3.getBucketLocation({ Bucket: s3BucketName }, (error, data) => {
        if (error) {
          reject(error)
          return
        }
        resolve(data.LocationConstraint)
      })
    })
  }
}
