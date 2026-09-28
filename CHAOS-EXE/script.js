/* =========================================================
   CHAOS.EXE
   Complete browser experiment
   No libraries. No backend. Just HTML + CSS + JS.
========================================================= */

const $ = (id) => document.getElementById(id);

const els = {
  button: $('chaosButton'),
  clicks: $('clickCount'),
  chaosBar: $('chaosBar'),
  chaosPercent: $('chaosPercent'),
  streak: $('streakCount'),
  message: $('message'),
  rarity: $('rarityTag'),
  events: $('eventCount'),
  achievements: $('achievementCount'),
  archiveBadge: $('archiveBadge'),
  stageName: $('stageName'),
  stageDescription: $('stageDescription'),
  stageBar: $('stageProgressBar'),
  stageNumber: $('stageNumber'),
  nextStage: $('nextStage'),
  hint: $('hint'),
  popup: $('achievementPopup'),
  achievementName: $('achievementName'),
  secretPopup: $('secretPopup'),
  secretName: $('secretName'),
  archiveModal: $('archiveModal'),
  archiveGrid: $('archiveGrid'),
  terminalModal: $('terminalModal'),
  terminalOutput: $('terminalOutput'),
  terminalInput: $('terminalInput'),
  overloadOverlay: $('overloadOverlay'),
  soundButton: $('soundButton'),
  screenFlash: $('screenFlash')
};

const SAVE_KEY = 'chaosExeFinalSave';
const TOTAL_EVENTS = 24;
const TOTAL_ACHIEVEMENTS = 12;

const state = {
  clicks: 0,
  streak: 0,
  bestStreak: 0,
  events: [],
  achievements: [],
  secrets: [],
  sound: true,
  overloadSeen: false,
  lastClick: 0,
  rapidClicks: [],
  idleTimer: null,
  sessionStart: Date.now(),
  terminalUnlocked: false
};

const stages = [
  { min: 0, name: 'SYSTEM STABLE', desc: 'Everything appears normal.', next: 'SYSTEM UNSTABLE' },
  { min: 20, name: 'SYSTEM UNSTABLE', desc: 'Minor anomalies detected.', next: 'CRITICAL' },
  { min: 40, name: 'CRITICAL', desc: 'Reality integrity is decreasing.', next: 'DANGEROUS' },
  { min: 60, name: 'DANGEROUS', desc: 'The system is fighting back.', next: 'CHAOTIC' },
  { min: 80, name: 'CHAOTIC', desc: 'Normal behaviour is no longer guaranteed.', next: 'SYSTEM FAILURE' },
  { min: 100, name: 'SYSTEM FAILURE', desc: 'You have broken the experiment. Keep going anyway.', next: 'MAXIMUM CHAOS' }
];

const normalMessages = [
  'Don\'t you dare.',
  'You pressed it.',
  'The system noticed.',
  'Interesting choice.',
  'Something changed.',
  'That was unnecessary.',
  'CHAOS INCREASING.',
  'System instability detected.',
  'You are making this worse.',
  'There is no going back.',
  'The button remembers.',
  'This was a terrible idea.',
  'Why are you still pressing it?',
  'Reality.exe is becoming unstable.'
];

const eventCatalog = [
  { id:'screen-shake', name:'SCREEN SHAKE', rarity:'common', desc:'The interface briefly loses its balance.', fn:screenShake },
  { id:'system-glitch', name:'SYSTEM GLITCH', rarity:'common', desc:'Reality.exe stops responding for a moment.', fn:glitchScreen },
  { id:'emoji-rain', name:'EMOJI RAIN', rarity:'common', desc:'The sky becomes aggressively expressive.', fn:emojiRain },
  { id:'system-message', name:'SYSTEM MESSAGE', rarity:'common', desc:'The machine says something it probably should not.', fn:systemMessage },
  { id:'static-burst', name:'STATIC BURST', rarity:'uncommon', desc:'A burst of corrupted signal tears through the UI.', fn:staticBurst },
  { id:'reverse-message', name:'REVERSE MESSAGE', rarity:'uncommon', desc:'The system writes backwards. Naturally.', fn:reverseMessage },
  { id:'whiteout', name:'WHITEOUT', rarity:'uncommon', desc:'A very brief encounter with the sun.', fn:whiteout },
  { id:'core-pulse', name:'CORE PULSE', rarity:'uncommon', desc:'The core energy spikes.', fn:corePulse },
  { id:'message-corruption', name:'MESSAGE CORRUPTION', rarity:'rare', desc:'The message channel becomes unreadable.', fn:messageCorruption },
  { id:'system-warning', name:'SYSTEM WARNING', rarity:'rare', desc:'The system questions your life choices.', fn:systemWarning },
  { id:'button-escape', name:'BUTTON ESCAPE', rarity:'rare', desc:'The button develops survival instincts.', fn:buttonEscape },
  { id:'screen-inversion', name:'SCREEN INVERSION', rarity:'rare', desc:'The world flips for a blink.', fn:screenInversion },
  { id:'gravity-flip', name:'GRAVITY FLIP', rarity:'epic', desc:'Gravity files a temporary complaint.', fn:gravityFlip },
  { id:'cursor-trail', name:'CURSOR TRAIL', rarity:'epic', desc:'Your cursor leaves a luminous trail.', fn:cursorTrail },
  { id:'matrix-mode', name:'MATRIX MODE', rarity:'epic', desc:'The interface briefly enters code rain mode.', fn:matrixMode },
  { id:'chaos-burst', name:'CHAOS BURST', rarity:'epic', desc:'Several small anomalies fire together.', fn:chaosBurst },
  { id:'overload', name:'OVERLOAD', rarity:'legendary', desc:'The experiment reaches critical mass.', fn:overloadEvent },
  { id:'blueout', name:'BLUEOUT', rarity:'legendary', desc:'Everything becomes electric blue.', fn:blueout },
  { id:'fake-error', name:'FAKE ERROR', rarity:'legendary', desc:'A completely legitimate error. Probably.', fn:fakeError },
  { id:'reality-scan', name:'REALITY SCAN', rarity:'legendary', desc:'The system scans the current session.', fn:realityScan },
  { id:'developer-room', name:'DEVELOPER ROOM', rarity:'legendary', desc:'You found somewhere you were not supposed to.', fn:developerRoom },
  { id:'nothing', name:'ABSOLUTELY NOTHING', rarity:'rare', desc:'The rarest event: the button does nothing.', fn:nothingEvent },
  { id:'button-panic', name:'BUTTON PANIC', rarity:'epic', desc:'The button rapidly changes its mind.', fn:buttonPanic },
  { id:'terminal-breach', name:'TERMINAL BREACH', rarity:'legendary', desc:'A hidden terminal becomes accessible.', fn:terminalBreach }
];

const achievements = [
  { id:'first', name:'FIRST CONTACT', desc:'Press the button once.', check:()=>state.clicks>=1 },
  { id:'ten', name:'BUTTON ADDICT', desc:'Reach 10 clicks.', check:()=>state.clicks>=10 },
  { id:'twentyfive', name:'NO SELF CONTROL', desc:'Reach 25 clicks.', check:()=>state.clicks>=25 },
  { id:'fifty', name:'HALF WAY TO HELL', desc:'Reach 50 clicks.', check:()=>state.clicks>=50 },
  { id:'hundred', name:'SYSTEM BREAKER', desc:'Reach 100 clicks.', check:()=>state.clicks>=100 },
  { id:'streak10', name:'RAPID FIRE', desc:'Get a 10-click streak.', check:()=>state.bestStreak>=10 },
  { id:'events5', name:'ANOMALY HUNTER', desc:'Discover 5 events.', check:()=>state.events.length>=5 },
  { id:'events12', name:'CHAOS RESEARCHER', desc:'Discover 12 events.', check:()=>state.events.length>=12 },
  { id:'events20', name:'ARCHIVIST', desc:'Discover 20 events.', check:()=>state.events.length>=20 },
  { id:'secret', name:'SOMETHING IS OFF', desc:'Find a hidden anomaly.', check:()=>state.secrets.length>=1 },
  { id:'terminal', name:'ROOT ACCESS', desc:'Open the hidden terminal.', check:()=>state.terminalUnlocked },
  { id:'all', name:'THEY SHOULD NOT ALL EXIST', desc:'Discover every event.', check:()=>state.events.length>=TOTAL_EVENTS }
];

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!saved) return;
    state.clicks = Number(saved.clicks)||0;
    state.streak = Number(saved.streak)||0;
    state.bestStreak = Number(saved.bestStreak)||0;
    state.events = Array.isArray(saved.events) ? saved.events : [];
    state.achievements = Array.isArray(saved.achievements) ? saved.achievements : [];
    state.secrets = Array.isArray(saved.secrets) ? saved.secrets : [];
    state.sound = saved.sound !== false;
    state.overloadSeen = !!saved.overloadSeen;
    state.terminalUnlocked = !!saved.terminalUnlocked;
  } catch { localStorage.removeItem(SAVE_KEY); }
}

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    clicks:state.clicks, streak:state.streak, bestStreak:state.bestStreak,
    events:state.events, achievements:state.achievements, secrets:state.secrets,
    sound:state.sound, overloadSeen:state.overloadSeen, terminalUnlocked:state.terminalUnlocked
  }));
}

function rand(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}

function getStage(){
  let stage=stages[0];
  for(const s of stages) if(state.clicks>=s.min) stage=s;
  return stage;
}

function updateUI(){
  const chaos=state.clicks>=100 ? 100 : (state.clicks*5);
  const stage=getStage();
  const index=stages.indexOf(stage);
  els.clicks.textContent=state.clicks;
  els.chaosBar.style.width=`${chaos}%`;
  els.chaosPercent.textContent=`${chaos}%`;
  els.streak.textContent=state.streak;
  els.events.textContent=state.events.length;
  els.achievements.textContent=state.achievements.length;
  els.archiveBadge.textContent=`${state.events.length}/${TOTAL_EVENTS}`;
  els.stageName.textContent=stage.name;
  els.stageDescription.textContent=stage.desc;
  els.stageNumber.textContent=`STAGE ${index+1} / ${stages.length}`;
  els.nextStage.textContent=state.clicks>=100?'MAXIMUM CHAOS':`NEXT: ${stage.next}`;
  const stageProgress=state.clicks>=100?100:(state.clicks%20)/20*100;
  els.stageBar.style.width=`${stageProgress}%`;
  if(state.clicks>=100) document.body.classList.add('overload');
  renderArchive();
}

function setMessage(text, rarity='standby'){
  els.message.textContent=text;
  els.rarity.textContent=rarity.toUpperCase();
  els.rarity.className=`rarity-tag ${rarity!=='standby'?`rarity-${rarity}`:''}`;
}

function registerEvent(event){
  if(!state.events.includes(event.id)){
    state.events.push(event.id);
    updateUI();
    checkAchievements();
    save();
  }
  setMessage(event.message || event.name, event.rarity);
}

function showToast(el){
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),3600);
}

function unlockAchievement(a){
  if(state.achievements.includes(a.id)) return;
  state.achievements.push(a.id);
  els.achievementName.textContent=a.name;
  showToast(els.popup);
  playTone(740,.1);
  save();
}

function checkAchievements(){
  achievements.forEach(a=>{if(a.check()) unlockAchievement(a);});
  els.achievements.textContent=state.achievements.length;
}

/* ---------- AUDIO ---------- */
let audioCtx=null;
function playTone(freq=440,duration=.08,type='sine'){
  if(!state.sound) return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(.045,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);
    o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);
  }catch{}
}

/* ---------- PARTICLES ---------- */
const canvas=$('particleCanvas'),ctx=canvas.getContext('2d');
let particles=[];
function resizeCanvas(){canvas.width=innerWidth;canvas.height=innerHeight;}
resizeCanvas();addEventListener('resize',resizeCanvas);
function burst(x,y,count=50,force=7){
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,s=Math.random()*force+1;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,size:Math.random()*3+1,life:1,grav:.06});
  }
}
function particleLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach((p,i)=>{
    p.x+=p.vx;p.y+=p.vy;p.vy+=p.grav;p.life-=.018;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=`rgba(110,195,255,${p.life})`;ctx.fill();
    if(p.life<=0)particles.splice(i,1);
  });
  requestAnimationFrame(particleLoop);
}
particleLoop();

/* ---------- EFFECTS ---------- */
function screenShake(){
  document.body.classList.remove('shake');void document.body.offsetWidth;document.body.classList.add('shake');
  setTimeout(()=>document.body.classList.remove('shake'),350);playTone(90,.1,'square');
}
function glitchScreen(){
  document.body.classList.remove('glitch');void document.body.offsetWidth;document.body.classList.add('glitch');
  setTimeout(()=>document.body.classList.remove('glitch'),400);playTone(120,.12,'sawtooth');
}
function emojiRain(){
  const icons=['⚡','💀','🔥','👀','🌀','💥','🤖','✦','◉'];
  for(let i=0;i<28;i++){
    const e=document.createElement('div');e.textContent=rand(icons);Object.assign(e.style,{position:'fixed',left:`${Math.random()*100}%`,top:'-50px',fontSize:`${18+Math.random()*26}px`,zIndex:35,pointerEvents:'none'});document.body.appendChild(e);
    const d=2+Math.random()*2;e.animate([{transform:'translateY(0) rotate(0deg)'},{transform:`translateY(${innerHeight+120}px) rotate(${360+Math.random()*720}deg)`}],{duration:d*1000,easing:'ease-in'});setTimeout(()=>e.remove(),d*1000);
  }
}
function systemMessage(){setMessage(rand(['WHY DID YOU WAKE ME UP?','USER BEHAVIOUR: CONCERNING.','PROCESSING CHAOS...','YOU HAVE BEEN OBSERVED.','STOP PRESSING THE BUTTON.','I SAID STOP.','...']),'common');}
function staticBurst(){for(let i=0;i<3;i++)setTimeout(glitchScreen,i*120);setMessage('SIGNAL CORRUPTION DETECTED','uncommon');}
function reverseMessage(){setMessage('YOU SHOULD NOT HAVE PRESSED THAT'.split('').reverse().join(''),'uncommon');}
function whiteout(){els.screenFlash.animate([{opacity:0},{opacity:.85},{opacity:0}],{duration:450});playTone(1000,.12);}
function corePulse(){els.button.animate([{transform:'scale(1)'},{transform:'scale(1.23)'},{transform:'scale(.92)'},{transform:'scale(1)'}],{duration:650,easing:'ease-out'});setMessage('CORE ENERGY SPIKE DETECTED','uncommon');playTone(620,.2,'triangle');}
function messageCorruption(){const chars='!@#$%^&*01ZX?';let s='';for(let i=0;i<30;i++)s+=rand(chars.split(''));setMessage(s,'rare');}
function systemWarning(){screenShake();setMessage('⚠ USER ACTIVITY EXCEEDS SAFE LIMITS ⚠','rare');}
function buttonEscape(){
  setMessage('THE BUTTON IS RUNNING AWAY.','rare');
  const x=(Math.random()-.5)*Math.min(520,innerWidth*.65),y=(Math.random()-.5)*Math.min(360,innerHeight*.45);
  els.button.style.transform=`translate(${x}px,${y}px)`;setTimeout(()=>els.button.style.transform='',950);
}
function screenInversion(){document.documentElement.style.filter='invert(.92) hue-rotate(180deg)';setTimeout(()=>document.documentElement.style.filter='',550);setMessage('THE WORLD WAS BACKWARDS FOR A MOMENT.','rare');}
function gravityFlip(){document.body.animate([{transform:'translateY(0)'},{transform:'translateY(-18px)'},{transform:'translateY(0)'}],{duration:700,easing:'ease-in-out'});setMessage('GRAVITY.EXE HAS ENTERED BETA.','epic');}
function cursorTrail(){
  setMessage('YOUR CURSOR HAS LEFT A TRACE.','epic');
  let left=0;
  const move=e=>{if(left++>45){removeEventListener('pointermove',move);return}const d=document.createElement('div');Object.assign(d.style,{position:'fixed',left:`${e.clientX}px`,top:`${e.clientY}px`,width:'7px',height:'7px',borderRadius:'50%',background:'#7cc8ff',boxShadow:'0 0 12px #2b8fff',pointerEvents:'none',zIndex:45});document.body.appendChild(d);d.animate([{opacity:.7,transform:'scale(1)'},{opacity:0,transform:'scale(0)'}],{duration:500});setTimeout(()=>d.remove(),500)};addEventListener('pointermove',move);
}
function matrixMode(){
  setMessage('CODE RAIN DETECTED.','epic');
  const old=els.hint.textContent;els.hint.textContent='01000101 01011000 01000101 01000011';setTimeout(()=>els.hint.textContent=old,1800);
  for(let i=0;i<12;i++){const d=document.createElement('div');d.textContent=rand(['0','1','X','E','R']);Object.assign(d.style,{position:'fixed',left:`${Math.random()*100}%`,top:'-20px',color:'#55b7ff',fontFamily:'monospace',zIndex:34,pointerEvents:'none'});document.body.appendChild(d);const dur=1+Math.random()*1.5;d.animate([{transform:'translateY(0)'},{transform:`translateY(${innerHeight+50}px)`}],{duration:dur*1000});setTimeout(()=>d.remove(),dur*1000)}
}
function chaosBurst(){screenShake();glitchScreen();burst(innerWidth/2,innerHeight/2,100,10);setMessage('MULTIPLE ANOMALIES DETECTED.','epic');}
function overloadEvent(){
  if(state.overloadSeen)return;
  state.overloadSeen=true;document.body.classList.add('overload');els.overloadOverlay.classList.remove('hidden');setMessage('SYSTEM OVERLOAD','legendary');screenShake();glitchScreen();burst(innerWidth/2,innerHeight/2,160,12);playTone(70,.5,'sawtooth');save();
}
function blueout(){document.body.animate([{filter:'none'},{filter:'brightness(2) saturate(2) hue-rotate(15deg)'},{filter:'none'}],{duration:1000});setMessage('EVERYTHING IS BLUE NOW.','legendary');}
function fakeError(){setMessage('ERROR 0xCHA0S: USER TOO CURIOUS.','legendary');setTimeout(()=>setMessage('...just kidding.','legendary'),900);}
function realityScan(){
  const mins=Math.floor((Date.now()-state.sessionStart)/60000);setMessage(`REALITY SCAN: ${state.clicks} CLICKS / ${state.events.length} ANOMALIES / ${mins} MIN SESSION`,'legendary');
}
function developerRoom(){state.terminalUnlocked=true;openTerminal();checkAchievements();setMessage('DEVELOPER ROOM ACCESSED.','legendary');save();}
function nothingEvent(){setMessage('...','rare');}
function buttonPanic(){
  setMessage('THE BUTTON HAS PANICKED.','epic');
  let n=0;const timer=setInterval(()=>{els.button.style.transform=`translate(${(Math.random()-.5)*80}px,${(Math.random()-.5)*55}px) rotate(${(Math.random()-.5)*8}deg)`;if(++n>8){clearInterval(timer);els.button.style.transform=''}},90);
}
function terminalBreach(){state.terminalUnlocked=true;openTerminal();setMessage('TERMINAL BREACH DETECTED.','legendary');save();}

/* ---------- RANDOM EVENT ENGINE ---------- */
function chooseEvent(){
  let pool=eventCatalog.filter(e=>e.id!=='overload' && e.id!=='developer-room' && e.id!=='terminal-breach');
  if(state.clicks>=60) pool.push(eventCatalog.find(e=>e.id==='button-escape'));
  if(state.clicks>=80) pool.push(...eventCatalog.filter(e=>['gravity-flip','cursor-trail','matrix-mode','chaos-burst','button-panic'].includes(e.id)));
  if(state.clicks>=100) pool.push(...eventCatalog.filter(e=>['overload','blueout','fake-error','reality-scan','developer-room','terminal-breach'].includes(e.id)));
  return rand(pool);
}

function triggerEvent(){
  const event=chooseEvent();
  if(event) {
    registerEvent(event);
    event.fn();
    burst(innerWidth/2,innerHeight/2,25,4);
  }
}

/* ---------- SECRET EVENTS ---------- */
function secret(id,name){
  if(state.secrets.includes(id))return false;
  state.secrets.push(id);els.secretName.textContent=name;showToast(els.secretPopup);checkAchievements();save();playTone(920,.14,'triangle');return true;
}

let idleTriggered=false;
function resetIdle(){
  clearTimeout(state.idleTimer);
  state.idleTimer=setTimeout(()=>{
    if(secret('idle','YOU FINALLY STOPPED')) setMessage('THE SYSTEM WAS WAITING FOR YOU.','epic');
  },15000);
}

let konami=[];
const konamiCode=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
addEventListener('keydown',e=>{
  if(e.key==='Escape'){els.archiveModal.classList.add('hidden');els.terminalModal.classList.add('hidden');}
  if(e.key==='Enter' && document.activeElement===els.terminalInput) return;
  konami.push(e.key);if(konami.length>konamiCode.length)konami.shift();
  if(konami.join('|')===konamiCode.join('|')){secret('konami','KONAMI BREACH');state.terminalUnlocked=true;openTerminal();}
});

/* ---------- ARCHIVE ---------- */
function renderArchive(){
  els.archiveGrid.innerHTML='';
  eventCatalog.forEach((e,i)=>{
    const unlocked=state.events.includes(e.id);
    const card=document.createElement('div');card.className=`archive-item ${unlocked?'':'locked'}`;
    card.innerHTML=`<div class="number">ANOMALY ${String(i+1).padStart(2,'0')}</div><div class="name">${unlocked?e.name:'UNKNOWN SIGNAL'}</div><div class="desc">${unlocked?e.desc:'Discover this event to reveal its record.'}</div>`;
    els.archiveGrid.appendChild(card);
  });
}

$('archiveButton').addEventListener('click',()=>{renderArchive();els.archiveModal.classList.remove('hidden');});
$('closeArchive').addEventListener('click',()=>els.archiveModal.classList.add('hidden'));

/* ---------- TERMINAL ---------- */
function terminalPrint(text){els.terminalOutput.textContent+=text+'\n';els.terminalOutput.scrollTop=els.terminalOutput.scrollHeight;}
function openTerminal(){
  els.terminalModal.classList.remove('hidden');
  els.terminalOutput.textContent='';
  terminalPrint('CHAOS TERMINAL v1.0');terminalPrint('Connection established.');terminalPrint('Type "help" for commands.');setTimeout(()=>els.terminalInput.focus(),50);
}
$('closeTerminal').addEventListener('click',()=>els.terminalModal.classList.add('hidden'));
els.terminalInput.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  const cmd=els.terminalInput.value.trim().toLowerCase();els.terminalInput.value='';terminalPrint('> '+cmd);
  if(cmd==='help')terminalPrint('help | status | events | clear | chaos | exit');
  else if(cmd==='status')terminalPrint(`CLICKS=${state.clicks}\nCHAOS=${Math.min(100,state.clicks*5)}%\nSTAGE=${getStage().name}`);
  else if(cmd==='events')terminalPrint(`${state.events.length}/${TOTAL_EVENTS} anomalies discovered.`);
  else if(cmd==='chaos'){triggerEvent();terminalPrint('Chaos event injected.');}
  else if(cmd==='clear')els.terminalOutput.textContent='';
  else if(cmd==='exit')els.terminalModal.classList.add('hidden');
  else terminalPrint('Unknown command. The machine is unimpressed.');
});

/* ---------- INPUT / GAMEPLAY ---------- */
els.button.addEventListener('click',()=>{
  const now=Date.now();
  state.clicks++;
  if(now-state.lastClick<850)state.streak++;else state.streak=1;
  state.lastClick=now;
  state.bestStreak=Math.max(state.bestStreak,state.streak);
  state.rapidClicks.push(now);state.rapidClicks=state.rapidClicks.filter(t=>now-t<3000);
  if(state.rapidClicks.length>=5)secret('rapid','BUTTON PANIC MODE');
  if(state.clicks===13)secret('thirteen','UNLUCKY NUMBER');
  if(state.clicks===69)secret('nice','NICE.');
  if(state.clicks===100)secret('breaker','YOU BROKE THE RULE');
  setMessage(rand(normalMessages),'standby');
  const rect=els.button.getBoundingClientRect();burst(rect.left+rect.width/2,rect.top+rect.height/2,65,8);playTone(230+Math.random()*120,.05,'sine');
  triggerEvent();checkAchievements();updateUI();save();resetIdle();
});

/* precise center secret */
els.button.addEventListener('pointerdown',e=>{
  const r=els.button.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  if(Math.hypot(e.clientX-cx,e.clientY-cy)<18)secret('precision','PRECISION DETECTED');
});

$('soundButton').addEventListener('click',()=>{state.sound=!state.sound;els.soundButton.textContent=state.sound?'🔊':'🔇';save();if(state.sound)playTone(600,.1)});
$('continueAfterOverload').addEventListener('click',()=>{els.overloadOverlay.classList.add('hidden');setMessage('SYSTEM REMAINS ONLINE. SOMEHOW.','legendary');});
$('resetButton').addEventListener('click',()=>{if(confirm('Erase all CHAOS.EXE progress?')){localStorage.removeItem(SAVE_KEY);location.reload();}});

/* ---------- EASTER EGG: TYPE CHAOS ANYWHERE ---------- */
let typed='';
addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
  if(e.key.length===1){typed=(typed+e.key.toLowerCase()).slice(-5);if(typed==='chaos'){secret('word','WORD DETECTED');triggerEvent();typed='';}}
});

load();
updateUI();
checkAchievements();
resetIdle();
els.soundButton.textContent=state.sound?'🔊':'🔇';
if(state.clicks>=100)document.body.classList.add('overload');
