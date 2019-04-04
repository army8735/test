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

  let start = Date.now();

  for(let i = 0; i < numCPUs && i < length; i++) {
    newProcess();
  }
  // single();

  function newProcess() {
    if(index >= length) {
      return;
    }
    let list = data[index++];
    let worker = cluster.fork();
    worker.on('message', (json) => {
      if(json.type === 1) {
        let res = json.v;
        for(let sel in res) {
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
      }
    });
    worker.on('exit', () => {
      count++;
      console.log('exit', count, length);
      if(count === length) {
        console.warn('fin', resHash.size, Date.now() - start);
        let list = [];
        for(let [sel, res] of resHash) {
          list.push(sel);
          if(res.eq > res.notEq && res.notEq > 0) {
            let ratio = res.eq / (res.eq + res.notEq);
            if(ratio > 0.5) {
              console.log(res, sel);
            }
          }
        }
        list.sort();
        fs.writeFileSync(path.join(__dirname, 'multi.txt'), list.join('\n'), { encoding: 'utf-8' });
        return;
      }
      newProcess();
    });
    worker.send({
      type: 1,
      index,
      value: list,
    });
  }

  function single() {
    data.forEach((list, i) => {
      console.log(i);
      resHash = calculate.exec(list);
    });
    console.warn('size ' + resHash.size, Date.now() - start);
    let list = [];
    for(let [sel, res] of resHash) {
      list.push(sel);
      if(res.eq > res.notEq && res.notEq > 0) {
        let ratio = res.eq / (res.eq + res.notEq);
        if(ratio > 0.5) {
          console.log(res, sel);
        }
      }
    }
    list.sort();
    fs.writeFileSync(path.join(__dirname, 'single.txt'), list.join('\n'), { encoding: 'utf-8' });
  }
}
else if(cluster.isWorker) {
  process.on('message', function(json) {
    if(json.type === 1) {
      let list = json.value;
      let res = calculate.exec(list);
      process.send({
        type: 1,
        index: json.index,
        v: res,
      }, () => {
        process.exit();
      });
    }
  });
}
