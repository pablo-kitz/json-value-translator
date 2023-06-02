import { listJSONFiles, parseFile, outputJSON } from './utils/filehandler.js';
import { processJSON } from './utils/traversejson.js';
import inquirer from 'inquirer';
import Queue from './utils/queue.js';
import { parse } from 'node-html-parser';
import { Scheduler } from '@translate-tools/core/util/Scheduler/Scheduler.js';
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator/index.js';

// import { supportedLanguages } from '@translate-tools/core/translators/GoogleTranslator/index.js';

// const lang = supportedLanguages

const htmlRegex = /<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/g; // regex validation for html tags
export const q = new Queue()

// Translator - Scheduler init
const translator = new GoogleTranslator({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
  },
});
export const scheduler = new Scheduler(translator)

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
export let translatorConfig = {
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

async function traverse(node) {
  for (let child of node.childNodes) {
    if (child.nodeType === 1) {
      await traverse(child);
    } else {
      child.textContent = await scheduler.translate(child.text, translatorConfig.langFrom, translatorConfig.langTo);
    }
  }
}


// Main
const main = async () => {
  const { fileSelect, langFrom, langTo } = await selectFile()
  translatorConfig = { langFrom, langTo };
  const selectedJson = parseFile(fileSelect)
  const result = await processJSON(selectedJson.parsedData)
  console.log(`\x1b[35m${q.size()} strings to translate`)
  outputJSON(result, selectedJson.filename, langTo)
}

main()