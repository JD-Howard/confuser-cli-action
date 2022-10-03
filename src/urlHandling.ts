import * as fs from 'fs'
import * as https from 'https'
import {IncomingMessage} from 'http'

export async function getUrlHeader(
  url: string,
  header: string
): Promise<string> {
  return new Promise(resolve => {
    https.get(url, (res: IncomingMessage) => {
      const value = res.headers[header]
      if (typeof value === 'string') {
        resolve(value)
      } else {
        resolve('')
      }
    })
  })
}

export async function downloadUrl(
  url: string,
  filePath: string
): Promise<boolean> {
  return new Promise(resolve => {
    https.get(url, (res: IncomingMessage) => {
      const file = fs.createWriteStream(filePath)
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(true)
      })
    })
  })
}
