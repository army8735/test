const Bignumber = require('bignumber.js');

let comboCache = new Map();
let resHash = Object.create(null);

function getCombListIndex(length, num) {
  if (num < 2 || num > length) {
    return [];
  }
  let key = length + ',' + num;
  if(comboCache.has(key)) {
    return comboCache.get(key);
  }
  let res = [];
  indexComb(res, [], 0, 0, num, length);
  comboCache.set(key, res);
  return res;
}

function indexComb(res, temp, current, index, num, length) {
  if(current === num - 1) {
    for (let i = index; i < length; i++) {
      let clone = Object.assign([], temp);
      clone.push(i);
      res.push(clone);
    }
  }
  else {
    for (let i = index; i <= length - num + current; i++) {
      let clone = Object.assign([], temp);
      clone.push(i);
      indexComb(res, clone, current + 1, i + 1, num, length);
    }
  }
}

function exec(list) {
  let sumCache = new Map();
  let selCache = new Map();
  // 先计算num=2作为前提缓存，供>=3的动态规划使用，每num都可以使用num-1上次计算的结果缓存
  let indexesList = getCombListIndex(list.length, 2);
  for(let i = 0, len = indexesList.length; i < len; i++) {
    let indexes = indexesList[i];
    let key = indexes.toString();
    // console.log(key);
    let sel = list[indexes[0]].k + '{+}' + list[indexes[1]].k;
    let sum = new Bignumber(list[indexes[0]].v).plus(list[indexes[1]].v);
    selCache.set(key, sel);
    sumCache.set(key, sum);
  }
  // 组合数量从小到大[3, list.length]
  for(let num = 3, len = list.length; num <= len; num++) {
    // console.log(num);
    // newCache最终付给老cache供下次使用，节省空间
    let selNewCache = new Map();
    let sumNewCache = new Map();
    // 先拿到num数量的组合列表，里面每项存的都是数组下标列表
    let indexesList = getCombListIndex(list.length, num);
    // console.log(num, len, indexesList);
    let indexes;
    for(let i = 0, len2 = indexesList.length; i < len2; i++) {
      // 目前只尝试前num-1数量的和是否等于剩下的最后一个，TODO: num-n是否等于剩下n个
      indexes = indexesList[i];
      // console.log(indexes);
      // 由于有num个数，任选其中一个作为和，其它作为加数
      let sumIndex;
      let addIndex;
      for(let j = 0; j < num; j++) {
        sumIndex = indexes[j];
        addIndex = [];
        for(let k = 0; k < num; k++) {
          if(k !== j) {
            addIndex.push(indexes[k]);
          }
        }
        let key = addIndex.toString();
        let preSel = selCache.get(key);
        let preSum = sumCache.get(key);
        // console.log(num, selCache.has(key));
        let target = list[sumIndex];
        let sel = preSel + '{=}' + target.k;
        // console.log(sel);
        let res;
        if(resHash[sel]) {
          res = resHash[sel];
        }
        else {
          res = {
            eq: 0,
            notEq: 0,
          };
          resHash[sel] = res;
        }
        if(preSum.eq(target.v)) {
          res.eq++;
        }
        else {
          res.notEq++;
        }
        // 最后一个时次序正常为下轮循环做缓存准备，同时整体最后一次无需为下轮循环做准备
        if(j === num - 1 && num < len) {
          key = indexes.toString();
          sel = preSel + '{+}' + target.k;
          let sum = preSum.plus(target.v);
          selNewCache.set(key, sel);
          sumNewCache.set(key, sum);
        }
      }
    }
    selCache = selNewCache;
    sumCache = sumNewCache;
  }
  return resHash;
}

module.exports = {
  resHash,
  exec,
};
