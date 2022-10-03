import * as fs from 'fs'
import * as proc from 'process';
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import AdmZip from 'adm-zip'
import {downloadUrl, getUrlHeader} from './urlHandling'

const localConfuserDir = '.\\confuser-cli'
const localZipPath = `${localConfuserDir}\\cli.zip`
const exePath = `${localConfuserDir}\\Confuser.CLI.exe`
const confuserExLatestUrl = 'https://github.com/mkaring/ConfuserEx/releases/latest'

async function run(): Promise<void> {
  let message = 'init';
  try {
    const crprojs = core.getMultilineInput('confuser-config').map(x => x.replace(/^["']*|["']*$/g, ''));
    
    crprojs.forEach(crproj => {
      message = `Could not find Confuser Configuration file at: ${crproj}`
      if (!fs.statSync(crproj).isFile()) {
        throw new Error(message)
      }
    })

    message = `This action requires a windows based runs-on context`;
    if (proc.platform !== 'win32') {
      throw new Error(message)
    }

    fs.mkdirSync('./confuser-cli')

    const actualLatestTagUrl = await getUrlHeader(confuserExLatestUrl, 'location')
    const targetTagUrl = actualLatestTagUrl.replace('/tag/', '/download/') + '/ConfuserEx-CLI.zip'
    const resolvedDownloadUrl = await getUrlHeader(targetTagUrl, 'location')
    await downloadUrl(resolvedDownloadUrl, localZipPath)

    message = `Failed to download from: ${resolvedDownloadUrl}`
    if (!fs.existsSync(localZipPath)) {
      throw new Error(message)
    }

    new AdmZip(localZipPath).getEntries().forEach(entry => {
      fs.writeFileSync(
        `${localConfuserDir}/${entry.entryName}`,
        entry.getData()
      )
    })

    message = `Failed to extract cli.zip. File not found: ${exePath}`;
    if (!fs.existsSync(exePath)) {
      throw new Error(message)
    }

    crprojs.forEach(async (crproj) => {
      const args: Array<string> = ['-n', crproj]

      const result = await exec.getExecOutput(exePath, args)
  
      message = `Something went wrong executing the provided crproj configuration\n${result.stdout}\n${result.stderr}`;
      if (result.exitCode !== 0) {
        throw new Error(message)
      }
    })
    
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Progress: ${message}\nError: ${error.message}`)
    }
  }
}

run()
