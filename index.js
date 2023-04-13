import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator/index.js';
import inquirer from 'inquirer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = fs.readdirSync(__dirname)
const htmlRegex = /<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/g;

function listJsonFiles() {
  let jsonFiles = []
  for (let file of files) {
    if (path.extname(file) == '.json' && file !== 'package-lock.json' && file !== 'package.json') {
      jsonFiles.push(file)
    }
  }
  console.log(jsonFiles)
}

const selectFile = async (dir) => {
  const files = listJsonFiles()
  const { file } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fileSelect',
      message: 'What file will you be translating?',
      choices: files,
    },
  ]);
  console.log(file)
};

const translator = new GoogleTranslator({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
  },
});

function processJSON(obj, langFrom, langTo) {
  let result = {};
  for (var key in obj) {
    result[key] = checkType(obj[key])
  }
  return result;
}

function checkType(obj) {
  if (typeof obj === 'string') {
    return processString(obj)
  } else if (Array.isArray(obj)) {
    return processArray(obj)
  } else {
    return processObject(obj)
  }
}

function processString(obj) {
  const matches = obj.matchAll(htmlRegex)
  // return await translator.translate(obj[key], langFrom, langTo);
  return obj
}

function processArray(obj) {
  let result = [];
  for (var element of obj) {
    try {
      // let processed = await translator.translate(processValues(obj[key][i]), langFrom, langTo);
      let processed = element
      result.push(processed);
    } catch (e) {
      new Error(e)
    }
  }
  return result
}

function processObject(obj) {
  let result = {}
  for (var key in obj) {
    result[key] = checkType(obj[key])
  }
  return result
}

// processJSON(pablo, 'es', 'en');