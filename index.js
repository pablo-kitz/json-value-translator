import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Scheduler } from '@translate-tools/core/util/Scheduler/Scheduler.js';
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator/index.js';
import inquirer from 'inquirer';
import { parse } from 'node-html-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __outputdir = './translations'
const files = fs.readdirSync(__dirname)
const htmlRegex = /<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/g; // regex validation for html tags

// Translator - Scheduler init
const translator = new GoogleTranslator({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
  },
});
const scheduler = new Scheduler(translator)

// Available languages list
const languages = [
  {
    name: "Automatic",
    value: "auto",
    short: "auto"
  },
  {
    name: "English",
    value: "en",
    short: "en"
  },
  {
    name: "Spanish",
    value: "es",
    short: "es"
  },
  {
    name: "Portuguese",
    value: "pt",
    short: "pt"
  },
  {
    name: "German",
    value: "de",
    short: "de"
  },
  {
    name: "Italian",
    value: "it",
    short: "it"
  },
  {
    name: "Lithuanian",
    value: "lt",
    short: "lt"
  },
  {
    name: "Polish",
    value: "pl",
    short: "pl"
  },
  {
    name: "Turkish",
    value: "tr",
    short: "tr"
  },
];

// Config init
let translatorConfig = {
  langFrom: '',
  langTo: ''
}

async function selectFile() {
  const files = listJSONFiles()
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'fileSelect',
      message: 'What file will you be translating?',
      choices: files,
    },
    {
      type: 'list',
      name: 'langFrom',
      message: 'What language is the JSON originally in?',
      choices: languages,
    },
    {
      type: 'list',
      name: 'langTo',
      message: 'What language do you want to translate to?',
      choices: languages,
    }
  ]);
  return answers;
};

function listJSONFiles() {
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

function loadJSON(file) {
  const rawdata = fs.readFileSync(file)
  const parsedFile = {
    filename: file,
    parsedData: JSON.parse(rawdata)
  }
  return parsedFile
}


async function processJSON(obj) {
  let result = {};
  for (var key in obj) {
    result[key] = await checkType(obj[key])
  }
  return result
}

async function checkType(obj) {
  if (typeof obj === 'string') {
    return await processString(obj)
  } else if (Array.isArray(obj)) {
    return processArray(obj)
  } else {
    return processObject(obj)
  }
}

async function processString(obj) {
  if (obj === "") {
    return ""
  }
  const htmlMatch = obj.match(htmlRegex)
  if (htmlMatch) {
    const root = parse(obj)
    await traverse(root)
    return root.toString()
  }
  const response = await scheduler.translate(obj, translatorConfig.langFrom, translatorConfig.langTo);
  return response
}

async function traverse(node) {
  for (let child of node.childNodes) {
    if (child.nodeType === 1) {
      await traverse(child);
    } else {
      child.textContent = await scheduler.translate(child.text, translatorConfig.langFrom, translatorConfig.langTo);
    }
  }
}

function processArray(obj) {
  let result = [];
  for (var element of obj) {
    try {
      let processed = processString(element)
      result.push(processed);
    } catch (e) {
      new Error(e)
    }
  }
  return result
}

async function processObject(obj) {
  let result = {}
  for (var key in obj) {
    result[key] = await checkType(obj[key])
  }
  return result
}

async function outputJSON(obj, filename, langTo) {
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

const main = async () => {
  const { fileSelect, langFrom, langTo } = await selectFile()
  translatorConfig.langFrom = langFrom;
  translatorConfig.langTo = langTo;
  const selectedJson = loadJSON(fileSelect)
  console.log('\x1b[35mYour JSON file is being translated, please wait')
  const result = await processJSON(selectedJson.parsedData)
  outputJSON(result, selectedJson.filename, langTo)
}

main()