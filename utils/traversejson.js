import { q, scheduler, translatorConfig } from '../index.js'

export async function processJSON(obj) {
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

async function processString(obj) {
  if (obj === "") {
    return ""
  }
  // const htmlMatch = obj.match(htmlRegex)
  // if (htmlMatch) {
  //   const root = parse(obj)
  //   await traverse(root)
  //   return root.toString()
  // }
  q.enqueue(obj)
  console.log(`\x1b[35mAdded a String for Translation`)
  const response = await scheduler.translate(obj, translatorConfig.langFrom, translatorConfig.langTo);
  return response
}
