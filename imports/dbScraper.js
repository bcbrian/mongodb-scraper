const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const excludedCollections = require('./excludedCollectionList.js').getCollectionList();

// Connection URLs
const sourceUrl = process.env.SOURCE_MONGO_URL;
let targetUrl = process.env.TARGET_MONGO_URL;

if(!sourceUrl){
  // Failed to load File
  console.error('Mongo source url not provided');
  return;
}

if(!targetUrl){
  // Failed to load File
  console.warn('Mongo target url not provided, using meteor db');
  targetUrl = 'mongodb://localhost:3001/local';
}

function includeThisCollection(name){
  return excludedCollections.indexOf(name) === -1;
};

// This function is to do only one collection for testing debugging setup
function processThisCollection(name){
  return true;
  // return name === 'someCollectionName';
};

const loaders = [];
let loaderStart = 0;
let loaderFinish = 0;
function showLoader(spinnerOnly){
  let loader = 0
  const killInterval = setInterval(()=>{
    if(loader > 3) loader = 0;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    if(!spinnerOnly){
      process.stdout.write(`[`);
      let loadString = '';
      let loadComplete = Math.floor((loaderStart / loaderFinish) * 10);
      while(loadComplete > 0){
        loadComplete --;
        loadString += '-';
      }
      process.stdout.cursorTo(1);
      process.stdout.write(loadString);
      process.stdout.cursorTo(11);
      process.stdout.write(`]`);
      process.stdout.cursorTo(15);
      process.stdout.write(`${loaderStart}`);
      process.stdout.cursorTo(18);
      process.stdout.write('/');
      process.stdout.cursorTo(19);
      process.stdout.write(`${loaderFinish}`);
      process.stdout.cursorTo(25);
      process.stdout.write(`Memory Used(MB): ${Math.ceil(process.memoryUsage().heapUsed / 1000000)}`);
      process.stdout.cursorTo(50);
      process.stdout.write(`${keepLoading}`);
      process.stdout.cursorTo(12);
    }

    if (loader === 0) {
      process.stdout.write(`|`);
    }
    if (loader === 1) {
      process.stdout.write(`/`);
    }
    if (loader === 2) {
      process.stdout.write(`-`);
    }
    if (loader === 3) {
      process.stdout.write('\\');
    }
    loader++;
  }, 100);
  loaders.push(killInterval);
}

function killLoader(){
  loaders.forEach((i)=>{
    clearInterval(i);
  });
}

const lines = process.stdout.getWindowSize()[1];
for(var i = 0; i < lines; i++) {
    console.log('\r\n');
}
process.stdout.write('\033c');

function printResult(index, itemCount, colName, startTime, err){
  const defaultColor = '\x1b[0m';
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(index + ': ' + defaultColor);
  process.stdout.cursorTo(10);
  process.stdout.write('NAME: ' + colName + defaultColor);
  process.stdout.cursorTo(60);
  const numberColor = itemCount > 900 ? '\x1b[31m' : defaultColor
  process.stdout.write('count: ' + numberColor + itemCount + defaultColor);
  process.stdout.cursorTo(80);
  const timeToComplete = Date.now() - startTime;
  const timeColor = timeToComplete > 10000 ? '\x1b[31m' : '\x1b[32m';
  process.stdout.write('time: ' + timeColor + timeToComplete + defaultColor);
  process.stdout.cursorTo(100);
  const saveText = err ? '\x1b[31m Failed to save!' : '\x1b[32m Saved!';
  process.stdout.write(saveText + defaultColor + '\n');
  if(err){
    console.log('');
    console.error(err);
    console.log('');
  }
  keepLoading--;
  loaderStart++;
}
let keepLoading = 0;
const SLEEP_TIME_FOR_METEOR = 10000;
setTimeout(() => {
  MongoClient.connect(sourceUrl, function(sourceError, sourceDB) {
    console.log('Source Error: ', sourceError);
    console.assert(null === sourceError);
    console.log('Connected successfully to source server');

    MongoClient.connect(targetUrl, function(targetError, targetDB) {
      console.log('Target Error: ', targetError);
      console.assert(null === targetError);
      console.log('Connected successfully to target server');

      sourceDB.listCollections().toArray().then(function (collections){
        console.log('collections');
        let collectionNames = collections.map((c) => c.name).sort();
        console.log(JSON.stringify(collectionNames, null, 2));
        collectionNames = collectionNames.filter(includeThisCollection);
        keepLoading = collectionNames.length;
        const collectionsByKey = {};
        loaderFinish = collectionNames.length;
        loaderStart = 0;
        showLoader();
        collectionNames.forEach((cn, index) => {
          // check to ignore it first.
          if(!includeThisCollection(cn)){
            // return console.log('Ignoring: ', cn);
            return;
          }
          collectionsByKey[cn] = {};
          collectionsByKey[cn].sourceCollection = sourceDB.collection(cn);
          collectionsByKey[cn].startTime = Date.now();

          if(processThisCollection(cn)){
            let query = {};
            switch (cn) {
              case 'someCollectionName':
                query = {
                  // Some unique query for this collection
                };
                break;
              default:
              query = {
                // Default query to use
              }
            }
            collectionsByKey[cn].promise = collectionsByKey[cn].sourceCollection.find(
              query,
              {},
              {}).toArray();
              // {limit: 100}).toArray(); // limit to small amount to make sure you have it all setup
            collectionsByKey[cn].promise.then((items) => {
              // here we want to write to the other db
              collectionsByKey[cn].targetCollection = targetDB.collection(cn);
              if(items.length > 0){
                //clear out the collection
                collectionsByKey[cn].targetCollection.remove({}, {}, (err, res) => {
                  const itemCount = items.length;
                  collectionsByKey[cn].targetCollection.insert(items, (err, items) => {
                    printResult(index, itemCount, cn, collectionsByKey[cn].startTime, err);
                  });
                });
              } else {
                printResult(index, 0, cn, collectionsByKey[cn].startTime, 'Error: No data in Collection');
              }
            });
          } else {
            printResult(index, new Array(1), cn, Date.now());
          }
        });
        const shutDown = setInterval(() => {
          if(!keepLoading){
            killLoader();
            clearInterval(shutDown);
            process.exit();
          }
        }, 5000);
      });
    });
  });
}, SLEEP_TIME_FOR_METEOR)
