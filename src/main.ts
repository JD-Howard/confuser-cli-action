import * as fs from 'fs'
import * as proc from 'process';
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import AdmZip from 'adm-zip'
import {downloadUrl, getUrlHeader} from './urlHandling'

const localConfuserDir = './confuser-cli'
const localZipPath = `${localConfuserDir}\cli.zip`
const exePath = `${localConfuserDir}\Confuser.CLI.exe`
const confuserExLatestUrl = 'https://github.com/mkaring/ConfuserEx/releases/latest'

async function run(): Promise<void> {
  try {
    const crproj = core.getInput('confuser-config')

    if (!fs.statSync(crproj).isFile()) {
      throw new Error(
        `Could not find Confuser Configuration file at: ${crproj}`
      )
    }

    if (proc.platform !== 'win32') {
      throw new Error(
        `This action requires a windows based runs-on context`
      )
    }

    fs.mkdirSync('./confuser-cli')

    const actualLatestTagUrl = await getUrlHeader(confuserExLatestUrl, 'location')
    const targetTagUrl = actualLatestTagUrl.replace('/tag/', '/download/') + '/ConfuserEx-CLI.zip'
    const resolvedDownloadUrl = await getUrlHeader(targetTagUrl, 'location')
    await downloadUrl(resolvedDownloadUrl, localZipPath)

    if (!fs.existsSync(localZipPath)) {
      throw new Error(
        `Failed to download from: ${resolvedDownloadUrl}`
      )
    }

    new AdmZip(localZipPath).getEntries().forEach(entry => {
      fs.writeFileSync(
        `${localConfuserDir}/${entry.entryName}`,
        entry.getData()
      )
    })

    if (!fs.existsSync(exePath)) {
      throw new Error(
        `Failed to extract cli.zip. File not found: ${exePath}`
      )
    }

    const args: Array<string> = ['-n', crproj]

    const result = await exec.getExecOutput(exePath, args)

    if (result.exitCode !== 0) {
      throw new Error(
        `Something went wrong executing the provided crproj configuration\n${result.stdout}\n${result.stderr}`
      )
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
