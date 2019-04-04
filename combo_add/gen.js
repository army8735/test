const fs = require('fs');
const path = require('path');

let s = '';

for(let i = 0; i < 30; i++) {
  let list = [];
  for(let j = 0; j < 7; j++) {
    let o = {};
    let k = String.fromCharCode(97 + j);
    // for(let j = 0; j < 5; j++) {
    //   k += k;
    // }
    o.k = k + i;
    o.v = j;
    list.push(o);
  }
  s += JSON.stringify(list) + '\n';
}

// console.log(s);

fs.writeFileSync(path.join(__dirname, 'data.txt'), s, { encoding: 'utf-8' });
