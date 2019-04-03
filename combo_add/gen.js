let list = [];

for(let i = 0; i < 16; i++) {
  let o = {};
  let k = String.fromCharCode(97 + i);
  // for(let j = 0; j < 5; j++) {
  //   k += k;
  // }
  o.k = k;
  o.v = i;
  list.push(o);
}

console.log(JSON.stringify(list));
