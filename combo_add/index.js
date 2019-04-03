const fs = require('fs');
const path = require('path');
const os = require('os');
const cluster = require('cluster');

const calculate = require('./calculate');

let numCPUs = os.cpus().length;
let resHash = new Map();

if(cluster.isMaster) {
  let data = fs.readFileSync(path.join(__dirname, 'data.txt'), { encoding: 'utf-8' });
  data = data.trim().split('\n');
  data = data.filter(item => item).map(item => {
    return JSON.parse(item);
  });

  let index = 0;
  let count = 0;
  let length = data.length;

  for(let i = 0; i < numCPUs && i < length; i++) {
    // newProcess();
  }
  single();

  function newProcess() {
    if(index >= length) {
      return;
    }
    let list = data[index++];
    let worker = cluster.fork();
    worker.on('message', (msg) => {
      let json = JSON.parse(msg);
      if(json.type === 1) {
        let [sel, res] = json.v;
        let obj;
        if(resHash.has(sel)) {
          obj = resHash.get(sel);
        }
        else {
          obj = {
            eq: 0,
            notEq: 0,
            idx: [],
          };
          resHash.set(sel, obj);
        }
        obj.eq += res.eq;
        obj.notEq += res.notEq;
        if(res.notEq) {
          obj.idx.push(json.index);
        }
      }
    });
    worker.on('exit', () => {
      count++;
      console.log('exit', count, length);
      if(count === length) {
        console.warn('fin', resHash.size);
        for(let [sel, res] of resHash) {
          if(res.eq > res.notEq && res.notEq > 0) {
            let ratio = res.eq / (res.eq + res.notEq);
            if(ratio > 0.5) {
              console.log(res, sel);
            }
          }
        }
        return;
      }
      newProcess();
    });
    worker.send(JSON.stringify({
      type: 1,
      index,
      value: list,
    }));
  }

  function single() {
    data.forEach((list, i) => {
      // console.log(i);
      resHash = calculate.exec(list);
    });
    console.warn('size ' + resHash.size);
    for(let [sel, res] of resHash) {
      if(res.eq > res.notEq && res.notEq > 0) {
        let ratio = res.eq / (res.eq + res.notEq);
        if(ratio > 0.5) {
          console.log(res, sel);
        }
      }
    }
  }
}
else if(cluster.isWorker) {
  process.on('message', function(msg) {
    let json = JSON.parse(msg);
    if(json.type === 1) {
      let list = json.value;
      let res = calculate.exec(list);
      for(let item of res) {
        process.send(JSON.stringify({
          type: 1,
          index: json.index,
          v: item,
        }));
      }
      process.exit();
    }
  });
}
