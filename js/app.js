/* 번쩍암산 — 연습/챌린지 진행 로직 */

let state = {
  category: 'arith', // 'arith' | 'combo' | 'base'
  mode: 'add',
  comboMode: 'perm',
  baseDir: 'to',
  baseM: 2,
  digitsA: 2,
  digitsB: 2,
  tier: 'normal',
  baseTier: 'normal',
  sessionType: null, // 'practice' | 'challenge'
  problem: null,
  input: '',
  solvedCount: 0,
  startTime: 0,
  timeLeft: 60,
  timerHandle: null,
  locked: false, // 정답 처리 중 입력 잠금
};

function $(sel){ return document.querySelector(sel); }
function show(el){ if(el) el.style.display=''; }
function hide(el){ if(el) el.style.display='none'; }

function selectCategory(category){
  const configSelectors = {
    arith: '#arith-config',
    combo: '#combo-config',
    base: '#base-config',
  };
  if(!configSelectors[category]) return;
  state.category = category;
  document.querySelectorAll('.category-toggle button').forEach(b=>b.classList.toggle('is-active', b.getAttribute('data-category')===category));
  Object.entries(configSelectors).forEach(([name, selector])=>{
    const config = $(selector);
    if(name === category) show(config); else hide(config);
  });
}

function selectMode(mode, btnEl, groupSelector){
  if(state.category === 'arith') state.mode = mode;
  else if(state.category === 'combo') state.comboMode = mode;
  document.querySelectorAll(groupSelector).forEach(b=>b.classList.remove('is-active'));
  if(btnEl) btnEl.classList.add('is-active');
}

function populateBaseMOptions(){
  const select = $('#base-m');
  const radices = [2,3,4,5,6,7,8,9];
  if(state.baseDir === 'from') radices.push(11,12,13,14,15,16);
  select.innerHTML = radices.map(m=>`<option value="${m}">${m}진법</option>`).join('');
  select.value = String(state.baseM);
}

function selectBaseDirection(dir, btnEl){
  if(dir !== 'to' && dir !== 'from') return;
  state.baseDir = dir;
  if(dir === 'to' && state.baseM > 9) state.baseM = 8;
  document.querySelectorAll('#base-config .mode-btn[data-dir]').forEach(b=>b.classList.toggle('is-active', b === btnEl));
  populateBaseMOptions();
}

function selectTier(tier, btnEl, groupSelector){
  if(state.category === 'combo') state.tier = tier;
  else if(state.category === 'base') state.baseTier = tier;
  document.querySelectorAll(groupSelector).forEach(b=>b.classList.remove('is-active'));
  if(btnEl) btnEl.classList.add('is-active');
}

function newProblem(){
  if(state.category === 'arith'){
    state.problem = generateProblem(state.mode, state.digitsA, state.digitsB);
  } else if(state.category === 'combo'){
    state.problem = generateComboProblem(state.comboMode, state.tier);
  } else {
    state.problem = generateBaseProblem(state.baseDir, state.baseM, state.baseTier);
  }
  state.input = '';
  state.locked = false;
  renderProblem();
}

function renderProblem(){
  const p = state.problem;
  hide($('#problem-column'));
  hide($('#problem-notation'));
  hide($('#problem-prompt'));

  if(p.displayType === 'vertical'){
    show($('#problem-column'));
    $('#prob-a').textContent = p.a.toLocaleString('ko-KR');
    $('#prob-op').textContent = p.op;
    $('#prob-b').textContent = p.b.toLocaleString('ko-KR');
  } else if(p.displayType === 'notation'){
    show($('#problem-notation'));
    const [n, sym, r] = p.notationParts;
    $('#problem-notation').innerHTML = `${n}<span class="sym">${sym}</span>${r}`;
  } else if(p.displayType === 'prompt'){
    show($('#problem-prompt'));
    $('#problem-prompt').textContent = p.promptText;
  }
  updateAnswerDisplay();
}

function updateAnswerDisplay(){
  const el = $('#answer-display');
  el.classList.remove('is-correct','is-wrong');
  if(state.input === ''){
    el.innerHTML = '<span class="placeholder">?</span>';
  } else {
    el.textContent = state.input;
  }
}

function startSession(type){
  state.sessionType = type;
  state.solvedCount = 0;
  state.startTime = Date.now();
  clearInterval(state.timerHandle);

  hide($('#view-setup'));
  hide($('#view-result'));
  show($('#view-practice'));

  if(type === 'challenge'){
    state.timeLeft = 60;
    $('#practice-mode-label').textContent = '60초 챌린지';
    show($('#timer-stat'));
    updateTimerDisplay();
    state.timerHandle = setInterval(()=>{
      state.timeLeft--;
      updateTimerDisplay();
      if(state.timeLeft <= 0){
        clearInterval(state.timerHandle);
        endSession();
      }
    }, 1000);
  } else {
    $('#practice-mode-label').textContent = '연습 모드';
    hide($('#timer-stat'));
  }

  $('#solved-count').textContent = '0';
  newProblem();
}

function updateTimerDisplay(){
  $('#timer-stat').innerHTML = `남은 시간 <b>${Math.max(0,state.timeLeft)}초</b>`;
}

function pressDigit(d){
  if(state.locked) return;
  if(state.input.length >= 9) return;
  state.input += String(d);
  updateAnswerDisplay();
}

function pressBackspace(){
  if(state.locked) return;
  state.input = state.input.slice(0,-1);
  updateAnswerDisplay();
}

function pressEnter(){
  if(state.locked || state.input === '') return;
  const userAnswer = parseInt(state.input, 10);
  const el = $('#answer-display');

  if(userAnswer === state.problem.answer){
    state.locked = true;
    el.classList.add('is-correct');
    state.solvedCount++;
    $('#solved-count').textContent = String(state.solvedCount);
    setTimeout(()=>{
      if(state.sessionType === 'challenge' && state.timeLeft <= 0) return;
      newProblem();
    }, 350);
  } else {
    el.classList.add('is-wrong');
    setTimeout(()=>{
      state.input = '';
      updateAnswerDisplay();
    }, 350);
  }
}

function endSession(){
  hide($('#view-practice'));
  show($('#view-result'));
  clearInterval(state.timerHandle);

  const elapsedMs = Date.now() - state.startTime;
  const elapsedSec = Math.round(elapsedMs/1000);

  if(state.sessionType === 'challenge'){
    $('#result-big').textContent = `${state.solvedCount}문제`;
    $('#result-label').textContent = '60초 동안 맞힌 문제 수';

    const key = state.category === 'arith'
      ? `flashmath_best_${state.mode}_${state.digitsA}_${state.digitsB}`
      : state.category === 'combo'
        ? `flashmath_best_combo_${state.comboMode}_${state.tier}`
        : `flashmath_best_base_${state.baseDir}_${state.baseM}_${state.baseTier}`;
    let best = 0;
    try{ best = parseInt(localStorage.getItem(key) || '0', 10); }catch(e){}
    let isNew = false;
    if(state.solvedCount > best){
      isNew = true;
      try{ localStorage.setItem(key, String(state.solvedCount)); }catch(e){}
      best = state.solvedCount;
    }
    $('#result-record-badge').style.display = isNew ? '' : 'none';
    $('#result-stats').innerHTML = `
      <div><div class="stat-num">${best}문제</div><div class="stat-label">내 최고기록</div></div>
    `;
  } else {
    const avgSec = state.solvedCount>0 ? (elapsedSec/state.solvedCount).toFixed(1) : '0';
    $('#result-big').textContent = `${state.solvedCount}문제`;
    $('#result-label').textContent = `${elapsedSec}초 동안 풀었어요`;
    $('#result-record-badge').style.display = 'none';
    $('#result-stats').innerHTML = `
      <div><div class="stat-num">${elapsedSec}초</div><div class="stat-label">총 시간</div></div>
      <div><div class="stat-num">${avgSec}초</div><div class="stat-label">문제당 평균</div></div>
    `;
  }
}

function bindKeyboard(){
  document.addEventListener('keydown', (e)=>{
    if(document.getElementById('view-practice').style.display === 'none') return;
    if(e.key >= '0' && e.key <= '9'){ pressDigit(e.key); }
    else if(e.key === 'Backspace'){ pressBackspace(); e.preventDefault(); }
    else if(e.key === 'Enter'){ pressEnter(); }
  });
}

function initHome(){
  if(typeof generateProblem === 'undefined' || typeof generateComboProblem === 'undefined' || typeof generateBaseProblem === 'undefined') return;

  document.querySelectorAll('.category-toggle button').forEach(btn=>{
    btn.addEventListener('click', ()=> selectCategory(btn.getAttribute('data-category')));
  });

  document.querySelectorAll('#arith-config .mode-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> selectMode(btn.getAttribute('data-mode'), btn, '#arith-config .mode-btn'));
  });
  document.querySelectorAll('#combo-config .mode-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> selectMode(btn.getAttribute('data-mode'), btn, '#combo-config .mode-btn'));
  });
  document.querySelectorAll('#base-config .mode-btn[data-dir]').forEach(btn=>{
    btn.addEventListener('click', ()=> selectBaseDirection(btn.getAttribute('data-dir'), btn));
  });
  populateBaseMOptions();
  document.getElementById('base-m').addEventListener('change', (e)=> state.baseM = parseInt(e.target.value,10));
  document.querySelectorAll('#combo-config .tier-row button').forEach(btn=>{
    btn.addEventListener('click', ()=> selectTier(btn.getAttribute('data-tier'), btn, '#combo-config .tier-row button'));
  });
  document.querySelectorAll('#base-config .tier-row button').forEach(btn=>{
    btn.addEventListener('click', ()=> selectTier(btn.getAttribute('data-tier'), btn, '#base-config .tier-row button'));
  });

  document.getElementById('digit-a').addEventListener('change', (e)=> state.digitsA = parseInt(e.target.value,10));
  document.getElementById('digit-b').addEventListener('change', (e)=> state.digitsB = parseInt(e.target.value,10));

  document.getElementById('start-practice-btn').addEventListener('click', ()=> startSession('practice'));
  document.getElementById('start-challenge-btn').addEventListener('click', ()=> startSession('challenge'));

  document.querySelectorAll('.keypad [data-key]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const k = btn.getAttribute('data-key');
      if(k === 'back') pressBackspace();
      else if(k === 'enter') pressEnter();
      else pressDigit(k);
    });
  });

  document.getElementById('quit-practice-btn').addEventListener('click', endSession);
  document.getElementById('retry-btn').addEventListener('click', ()=> startSession(state.sessionType));
  document.getElementById('back-to-setup-btn').addEventListener('click', ()=>{
    hide(document.getElementById('view-result'));
    show(document.getElementById('view-setup'));
  });

  bindKeyboard();
}

document.addEventListener('DOMContentLoaded', initHome);
