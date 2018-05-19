'use babel'

/* global atom */

import AWS from 'aws-sdk';
import fs from 'fs'
import path from 'path'
import uuidv4 from 'uuid/v4';
import UploadedFile from '../models/uploaded-file'

export default class S3Client {
  constructor() {
    this.s3 = new AWS.S3()
  }

  async upload(
    s3BucketName,
    s3DirectoryPath,
    fileName,
    filePath,
    mimeType,
    useUuidAsFileName = true,
    s3BucketCustomUrl = null
  ) {
    const s3BucketAvailable = await this.checkS3BucketAvailable(s3BucketName)
    const s3BucketLocation = await this.getS3BucketLocation(s3BucketName)

    console.log(`S3uploader start uploading: ${filePath} (${mimeType})`)
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (readError, fileBody) => {
        if (readError) {
          reject(readError)
          return
        }
        let s3Path = path.join(s3DirectoryPath, fileName)
        if (useUuidAsFileName) {
          const extension = path.extname(filePath)
          s3Path = path.join(s3DirectoryPath, `${uuidv4()}${extension}`)
        }
        const params = {
          Bucket: s3BucketName,
          Key: s3Path,
          Body: fileBody,
          ContentType: mimeType,
          ACL: 'public-read'
        }
        this.s3.putObject(params, (error, data) => {
          if (error) {
            reject(error)
            return
          }
          let url = `https://s3.${s3BucketLocation}.amazonaws.com/${s3BucketName}/${s3Path}`
          if (s3BucketCustomUrl) {
            url = `${s3BucketCustomUrl}/${s3Path}`
          }
          console.log(`File uploaded to ${url}.`)
          resolve(new UploadedFile(fileName, url, mimeType))
        })
      })
    })
  }

  async checkS3BucketAvailable(s3BucketName) {
    return new Promise((resolve, reject) => {
      this.s3.headBucket({ Bucket: s3BucketName }, (error, data) => {
        if (error) {
          reject(error)
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
