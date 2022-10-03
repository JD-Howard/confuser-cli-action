import * as fs from 'fs'
import AdmZip from 'adm-zip'
import {expect, test} from '@jest/globals'
import {downloadUrl, getUrlHeader} from '../src/urlHandling'

test('get confuser resources', async () => {
  try {
    fs.rmSync('./__tests__/downloaded', {recursive: true, force: true})
  } finally {
    fs.mkdirSync('./__tests__/downloaded')
  }

  const reqUrl1 = 'https://github.com/mkaring/ConfuserEx/releases/latest'
  const redirect = await getUrlHeader(reqUrl1, 'location')
  const reqUrl2 =
    redirect.replace('/tag/', '/download/') + '/ConfuserEx-CLI.zip'
  const download = await getUrlHeader(reqUrl2, 'location')
  const localPath = './__tests__/downloaded/ConfuserEx-CLI.zip'
  await downloadUrl(download, localPath)

  expect(fs.existsSync(localPath)).toBe(true)

  new AdmZip(localPath).getEntries().forEach(entry => {
    fs.writeFileSync(`./__tests__/downloaded/${entry.entryName}`, entry.getData())
  })

  expect(fs.existsSync('./__tests__/downloaded/Confuser.CLI.exe')).toBe(true)
})
