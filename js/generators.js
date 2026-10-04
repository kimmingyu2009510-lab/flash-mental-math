/* 번쩍암산 — 문제 생성 엔진
   사칙연산(자릿수 기반)과 경우의수(난이도 기반) 두 카테고리를 지원한다.
   모든 생성 함수는 { displayType, answer, ... } 형태를 반환한다.
   displayType: 'vertical'(세로셈) | 'notation'(nPr 표기) | 'prompt'(짧은 상황문) */

function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

/* ---------------- 사칙연산 ---------------- */

function randDigits(n){
  n = Math.max(1, Math.min(5, n));
  if(n === 1) return randInt(1,9);
  const min = Math.pow(10, n-1);
  const max = Math.pow(10, n) - 1;
  return randInt(min, max);
}

function genAdd(da, db){
  const a = randDigits(da), b = randDigits(db);
  return { displayType:'vertical', a, b, op:'+', answer: a+b };
}
function genSub(da, db){
  let a = randDigits(da), b = randDigits(db);
  let guard = 0;
  while(a < b && guard < 30){ b = randDigits(db); guard++; }
  if(a < b){ const t=a; a=b; b=t; }
  return { displayType:'vertical', a, b, op:'−', answer: a-b };
}
function genMul(da, db){
  const a = randDigits(da), b = randDigits(db);
  return { displayType:'vertical', a, b, op:'×', answer: a*b };
}
function genDiv(da, db){
  const quotient = randDigits(da);
  const divisor = randDigits(db);
  const dividend = quotient * divisor;
  return { displayType:'vertical', a: dividend, b: divisor, op:'÷', answer: quotient };
}

const ARITH_GENERATORS = { add: genAdd, sub: genSub, mul: genMul, div: genDiv };

function generateProblem(mode, digitsA, digitsB){
  let actualMode = mode;
  if(mode === 'mixed') actualMode = ['add','sub','mul','div'][randInt(0,3)];
  const p = ARITH_GENERATORS[actualMode](digitsA, digitsB);
  return { ...p, mode: actualMode };
}

/* ---------------- 경우의수 ---------------- */

function factorial(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function nPr(n,r){ return factorial(n)/factorial(n-r); }
function nCr(n,r){ return nPr(n,r)/factorial(r); }

function genPermutation(tier){
  const ranges = { easy:{n:[3,5],r:[1,2]}, normal:{n:[4,7],r:[2,3]}, hard:{n:[5,9],r:[2,4]} };
  const cfg = ranges[tier] || ranges.normal;
  const n = randInt(cfg.n[0], cfg.n[1]);
  const r = randInt(cfg.r[0], Math.min(cfg.r[1], n));
  return { displayType:'notation', notationParts:[String(n),'P',String(r)], answer: nPr(n,r) };
}

function genCombination(tier){
  const ranges = { easy:{n:[3,6],r:[1,3]}, normal:{n:[5,8],r:[2,4]}, hard:{n:[6,10],r:[2,5]} };
  const cfg = ranges[tier] || ranges.normal;
  const n = randInt(cfg.n[0], cfg.n[1]);
  const r = randInt(cfg.r[0], Math.min(cfg.r[1], n));
  return { displayType:'notation', notationParts:[String(n),'C',String(r)], answer: nCr(n,r) };
}

const PRODUCT_2 = [
  n=>`상의 ${n[0]}종류, 하의 ${n[1]}종류를 짝지어 입는 방법은?`,
  n=>`메인 요리 ${n[0]}가지 중 하나, 디저트 ${n[1]}가지 중 하나를 고르는 방법은?`,
  n=>`A지점에서 B지점으로 가는 길 ${n[0]}가지, B지점에서 C지점으로 가는 길 ${n[1]}가지가 있을 때, A에서 C로 가는 방법은?`,
];
const PRODUCT_3 = [
  n=>`상의 ${n[0]}종류, 하의 ${n[1]}종류, 신발 ${n[2]}종류를 짝지어 코디하는 방법은?`,
  n=>`전채 ${n[0]}가지, 메인 ${n[1]}가지, 디저트 ${n[2]}가지를 각각 하나씩 고르는 방법은?`,
];

function genProductRule(tier){
  const ranges2 = { easy:[2,5], normal:[2,6], hard:[3,9] };
  const ranges3 = { easy:[2,3], normal:[2,4], hard:[2,6] };
  const useThree = tier === 'hard' && Math.random() < 0.5;
  const [lo,hi] = useThree ? ranges3[tier] : ranges2[tier] || ranges2.normal;
  const count = useThree ? 3 : 2;
  const nums = Array.from({length:count}, ()=>randInt(lo,hi));
  const templates = useThree ? PRODUCT_3 : PRODUCT_2;
  const tmpl = templates[randInt(0,templates.length-1)];
  const answer = nums.reduce((a,b)=>a*b,1);
  return { displayType:'prompt', promptText: tmpl(nums), answer };
}

const SUM_2 = [
  n=>`빨간 티셔츠 ${n[0]}벌 또는 파란 티셔츠 ${n[1]}벌 중 하나를 고르는 방법은?`,
  n=>`A코스 ${n[0]}가지, B코스 ${n[1]}가지 중 하나만 고를 때 방법은?`,
  n=>`버스로 가는 방법 ${n[0]}가지 또는 지하철로 가는 방법 ${n[1]}가지 중 하나를 고를 때 방법은?`,
];

function genSumRule(tier){
  const ranges = { easy:[2,6], normal:[2,8], hard:[3,12] };
  const [lo,hi] = ranges[tier] || ranges.normal;
  const nums = [randInt(lo,hi), randInt(lo,hi)];
  const tmpl = SUM_2[randInt(0,SUM_2.length-1)];
  return { displayType:'prompt', promptText: tmpl(nums), answer: nums[0]+nums[1] };
}

function genPowerCount(tier){
  const kind = Math.random() < 0.5 ? 'coin' : 'dice';
  let n, base, label, particle;
  if(kind === 'coin'){
    base = 2; label = '동전'; particle = '을';
    const ranges = { easy:[2,3], normal:[3,4], hard:[4,6] };
    const [lo,hi] = ranges[tier] || ranges.normal; n = randInt(lo,hi);
  } else {
    base = 6; label = '주사위'; particle = '를';
    const ranges = { easy:[1,2], normal:[2,2], hard:[2,3] };
    const [lo,hi] = ranges[tier] || ranges.normal; n = randInt(lo,hi);
  }
  const answer = Math.pow(base,n);
  return { displayType:'prompt', promptText: `${label}${particle} ${n}번 던졌을 때 나올 수 있는 모든 경우의 수는?`, answer };
}

const COMBO_GENERATORS = { perm:genPermutation, comb:genCombination, product:genProductRule, sum:genSumRule, power:genPowerCount };

function generateComboProblem(mode, tier){
  let actualMode = mode;
  if(mode === 'mixed') actualMode = ['perm','comb','product','sum','power'][randInt(0,4)];
  const p = COMBO_GENERATORS[actualMode](tier);
  return { ...p, mode: actualMode };
}

function numWithBits(bits){ return randInt(1 << (bits-1), (1 << bits) - 1); }

const BASE_TIER = {
  easy:   { bits:[3,4], octRange:[8,63],     hexDecRange:[10,63],    hexBinRange:[1,15] },
  normal: { bits:[5,6], octRange:[64,511],   hexDecRange:[64,255],   hexBinRange:[16,127] },
  hard:   { bits:[7,8], octRange:[512,4095], hexDecRange:[256,4095], hexBinRange:[128,255] },
};
function baseCfg(tier){ return BASE_TIER[tier] || BASE_TIER.normal; }
function digitsAsNumber(str){ return parseInt(str, 10); }

function genDecToBin(tier){
  const cfg = baseCfg(tier);
  const n = numWithBits(randInt(cfg.bits[0], cfg.bits[1]));
  return { displayType:'prompt', promptText:`10진수 ${n} → 2진수로 바꾸면?`, answer: digitsAsNumber(n.toString(2)) };
}
function genBinToDec(tier){
  const cfg = baseCfg(tier);
  const n = numWithBits(randInt(cfg.bits[0], cfg.bits[1]));
  return { displayType:'prompt', promptText:`2진수 ${n.toString(2)} → 10진수로 바꾸면?`, answer: n };
}
function genOctal(tier){
  const cfg = baseCfg(tier);
  const n = randInt(cfg.octRange[0], cfg.octRange[1]);
  if(Math.random() < 0.5){
    return { displayType:'prompt', promptText:`10진수 ${n} → 8진수로 바꾸면?`, answer: digitsAsNumber(n.toString(8)) };
  }
  return { displayType:'prompt', promptText:`8진수 ${n.toString(8)} → 10진수로 바꾸면?`, answer: n };
}
function genHexToDec(tier){
  const cfg = baseCfg(tier);
  const n = randInt(cfg.hexDecRange[0], cfg.hexDecRange[1]);
  return { displayType:'prompt', promptText:`16진수 ${n.toString(16).toUpperCase()} → 10진수로 바꾸면?`, answer: n };
}
function genHexToBin(tier){
  const cfg = baseCfg(tier);
  const n = randInt(cfg.hexBinRange[0], cfg.hexBinRange[1]);
  return { displayType:'prompt', promptText:`16진수 ${n.toString(16).toUpperCase()} → 2진수로 바꾸면?`, answer: digitsAsNumber(n.toString(2)) };
}
function genBinAdd(tier){
  const bitsByTier = { easy:[3,3], normal:[4,4], hard:[5,6] };
  const [lo,hi] = bitsByTier[tier] || bitsByTier.normal;
  const a = numWithBits(randInt(lo,hi)), b = numWithBits(randInt(lo,hi));
  return { displayType:'prompt', promptText:`2진수 ${a.toString(2)} + ${b.toString(2)} = ? (2진수로 답하기)`, answer: digitsAsNumber((a+b).toString(2)) };
}

const BASE_GENERATORS = { d2b:genDecToBin, b2d:genBinToDec, oct:genOctal, h2d:genHexToDec, h2b:genHexToBin, badd:genBinAdd };

function generateBaseProblem(mode, tier){
  let actualMode = mode;
  if(mode === 'mixed') actualMode = Object.keys(BASE_GENERATORS)[randInt(0, Object.keys(BASE_GENERATORS).length-1)];
  const p = BASE_GENERATORS[actualMode](tier);
  return { ...p, mode: actualMode };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateProblem, generateComboProblem, generateBaseProblem, randDigits, ARITH_GENERATORS, COMBO_GENERATORS, BASE_GENERATORS };
}
