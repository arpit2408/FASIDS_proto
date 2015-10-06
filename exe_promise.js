var Promise = require('promise');
// var fs = require("fs");
function readFile(filename, enc){
  return new Promise(function (fulfill, reject){
    fs.readFile(filename, enc, function (err, res){
      if (err) reject(err);
      else fulfill(res);
    });
  });
}

function readJSON(filename){
  return readFile(filename, 'utf8').then(JSON.parse).catch(function(err){console.log(err);});
}


var object = readJSON("test.json");
console.log(object);
console.log("line 22")