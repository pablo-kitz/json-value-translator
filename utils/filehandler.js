import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = fs.readdirSync(__dirname)
const __outputdir = './translations'

export function listJSONFiles() {
  let jsonFiles = []
  for (let file of files) {
    if (path.extname(file) == '.json' && file !== 'package-lock.json' && file !== 'package.json') {
      jsonFiles.push(file)
    }
  }
  if (jsonFiles.length === 0) {
    throw new Error('No editable JSON files in the directory')
  }
  return jsonFiles
};

export function parseFile(file) {
  const rawdata = fs.readFileSync(file)
  const parsedFile = {
    filename: file,
    parsedData: JSON.parse(rawdata)
  }
  return parsedFile
}

export async function outputJSON(obj, filename, langTo) {
  const dotIndex = filename.lastIndexOf('.')
  const outputName = filename.substring(0, dotIndex) + `-${langTo}` + filename.substring(dotIndex)
  const output = JSON.stringify(obj);
  if (!fs.existsSync(__outputdir)) {
    fs.mkdirSync(__outputdir)
  }
  if (fs.existsSync(`${__outputdir}/${outputName}`)) {
    const answer = await confirmOverwrite()
    if (!answer) {
      throw new Error('Translation has been cancelled')
    }
  };
  try {
    fs.writeFileSync(path.join(__outputdir, outputName), output)
    return console.log('File generated succesfully, check your output folder')
  } catch (e) {
    throw new Error(e)
  }
}

async function confirmOverwrite() {
  const answer = await inquirer.prompt({
    type: 'confirm',
    name: 'overwriteFile',
    message: 'A translation for the file you selected already exists, do you wish to overwrite it?'
  })
  return answer.overwriteFile
}