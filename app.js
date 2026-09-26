const $ = id => document.getElementById(id);
const unitSelect = $('unitName'), customUnit = $('customUnit'), customWrap = $('customWrap');
const aliasesInput = $('roleKeywords'), orderInput = $('orderInput'), result = $('result'), status = $('status');
const fullTranslate = $('fullTranslate');

unitSelect.addEventListener('change', () => customWrap.classList.toggle('hidden', unitSelect.value !== 'custom'));

const headings = {
  situation: [/^\s*1[\).:\-]?\s*(situation|situasjon)\b/i, /^\s*(situation|situasjon)\s*[:\-]?\s*$/i],
  mission: [/^\s*2[\).:\-]?\s*(mission|oppdrag)\b/i, /^\s*(mission|oppdrag)\s*[:\-]?\s*$/i],
  execution: [/^\s*3[\).:\-]?\s*(execution|utførelse|gjennomføring)\b/i, /^\s*(execution|utførelse|gjennomføring)\s*[:\-]?\s*$/i],
  sustainment: [/^\s*4[\).:\-]?\s*(sustainment|admin(?:istration)?(?:\s*(?:&|and)\s*logistics)?|logistics|administrasjon|forsyning)\b/i],
  command: [/^\s*5[\).:\-]?\s*(command(?:\s*(?:&|and)\s*signal)?|signal|ledelse|samband)\b/i, /^\s*(command\s*(?:&|and)?\s*signal|ledelse\s*(?:&|og)?\s*samband)\s*[:\-]?\s*$/i]
};

const subsectionRx = /^(?:[a-z]\.|\([a-z]\)|\d+\)|\d+\.|[IVX]+\.|[A-Z][A-Z ]{2,20}:)\s*/i;

function normalize(s){
  return String(s||'').replace(/^\s*[-•*]+\s*/, '').replace(subsectionRx,'').replace(/\s+/g,' ').trim();
}

function splitSentences(line){
  const clean = normalize(line);
  if(!clean) return [];
  // Behold korte ordrelinjer intakt, men del lange avsnitt i setninger.
  if(clean.length < 150) return [clean];
  return clean.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(normalize).filter(Boolean);
}

function parseSections(text){
  const s={situation:[],mission:[],execution:[],sustainment:[],command:[],other:[]};
  let cur='other';
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim(); if(!line) continue;
    let hit=false;
    for(const [key,pats] of Object.entries(headings)){
      for(const p of pats){
        if(p.test(line)){
          cur=key; hit=true;
          const after=line.replace(p,'').replace(/^\s*[:\-–—]\s*/,'').trim();
          if(after) s[cur].push(...splitSentences(after));
          break;
        }
      }
      if(hit) break;
    }
    if(!hit) s[cur].push(...splitSentences(line));
  }
  return s;
}

function currentUnit(){ return unitSelect.value==='custom' ? (customUnit.value.trim()||'MITT LAG') : unitSelect.value; }

function keywordSet(){
  const u=currentUnit();
  const auto=[u,u.replace(/-/g,' '),u.replace(/-/g,''),u.toUpperCase()];
  const m=u.match(/^(\d+)\s*-?\s*Papa$/i);
  if(m){
    const n=m[1];
    auto.push(`Papa ${n}`,`Papa-${n}`,`${n} Papa`,`${n}P`,`${n}PAPA`,`${n} PAPA`,`P${n}`,`${n}/PAPA`);
  }
  const extra=aliasesInput.value.split(/[,;|]/).map(x=>x.trim()).filter(Boolean);
  return [...new Set([...auto,...extra].filter(Boolean))];
}

function canon(s){ return s.toLowerCase().replace(/[–—]/g,'-').replace(/[^a-z0-9æøå/-]+/g,' ').replace(/\s+/g,' ').trim(); }
function mentions(line,keys){ const l=canon(line); return keys.some(k=>{ const kk=canon(k); return kk && (l.includes(kk) || l.replace(/\s/g,'').includes(kk.replace(/\s/g,''))); }); }
function uniq(a){ const seen=new Set(); return a.filter(x=>{const k=canon(x);if(!k||seen.has(k))return false;seen.add(k);return true;}); }

// Lokal fallback for vanlige militære uttrykk.
const phrases = [
  [/commander'?s intent/gi,'sjefens intensjon'],[/enemy forces?/gi,'fiendtlige styrker'],[/friendly forces?/gi,'egne styrker'],
  [/support by fire/gi,'støtte med ild'],[/supporting fire/gi,'støtteild'],[/seize(?:s|d)?/gi,'ta'],[/secure(?:s|d)?/gi,'sikre'],[/clear(?:s|ed|ing)?/gi,'rydde'],
  [/defend(?:s|ed|ing)?/gi,'forsvare'],[/assault(?:s|ed|ing)?/gi,'angripe'],[/breach(?:es|ed|ing)?/gi,'bryte inn'],
  [/destroy(?:s|ed|ing)?/gi,'bekjempe'],[/move(?:s|d|ing)?/gi,'fremrykke'],[/advance(?:s|d|ing)?/gi,'rykke frem'],[/withdraw(?:s|n|ing)?/gi,'trekke ut'],
  [/follow(?:s|ed|ing)?/gi,'følge'],[/establish(?:es|ed|ing)?/gi,'etablere'],[/hold(?:s|ing)?/gi,'holde'],[/block(?:s|ed|ing)?/gi,'blokkere'],
  [/report(?:s|ed|ing)?/gi,'melde'],[/do not/gi,'ikke'],[/no later than/gi,'senest'],[/NLT\b/gi,'senest'],
  [/platoon net/gi,'troppsnett'],[/squad internal/gi,'internt lagsnett'],[/callsign/gi,'kallesignal'],[/succession/gi,'rekkefølge ved bortfall'],
  [/squad leader/gi,'lagfører'],[/team leader alpha/gi,'lagfører Alpha'],[/team leader bravo/gi,'lagfører Bravo'],
  [/ammo resupply/gi,'ammunisjonsforsyning'],[/medical supplies/gi,'sanitetsmateriell'],[/civilian presence is possible/gi,'sivile kan være til stede'],
  [/observation posts?/gi,'observasjonsposter'],[/light patrols?/gi,'lette patruljer'],[/from the north/gi,'fra nord'],[/from the south/gi,'fra sør'],
  [/from the east/gi,'fra øst'],[/from the west/gi,'fra vest'],[/north of/gi,'nord for'],[/south of/gi,'sør for'],[/east of/gi,'øst for'],[/west of/gi,'vest for'],
  [/east to west/gi,'øst mot vest'],[/west to east/gi,'vest mot øst'],[/north to south/gi,'nord mot sør'],[/south to north/gi,'sør mot nord'],
  [/in order to/gi,'for å'],[/objective/gi,'objekt'],[/route/gi,'akse'],[/building/gi,'bygning'],[/compound/gi,'område'],[/platoon/gi,'tropp'],
  [/squad/gi,'lag'],[/radio/gi,'samband'],[/channel/gi,'kanal'],[/frequency/gi,'frekvens'],[/rules? of engagement/gi,'engasjementsregler'],
  [/PID required/gi,'positiv identifikasjon kreves'],[/360 security/gi,'360° sikring'],[/rally point/gi,'samlepunkt'],[/phase line/gi,'faselinje'],
  [/maneuver/gi,'manøver'],[/ready to/gi,'klar til å'],[/old castle/gi,'OLD CASTLE']
];
function localTranslate(line){ let out=line; for(const [r,repl] of phrases) out=out.replace(r,repl); return out.replace(/\s+/g,' ').trim(); }

function protectTokens(text){
  const tokens=[];
  const pattern=/\b(?:\d+-Papa|PAPA[- ]?\d|\d+\/?\d*\s*PAPA|OBJ\s*[A-Z0-9-]+|RP\s*[A-Z0-9-]+|PL\s*[A-Z0-9-]+|ORP\s*[A-Z0-9-]+|LOA|LD|CCP|CASEVAC|MEDEVAC|ROE|PID|SBF|NLT|H[- ]?HOUR|CH\s*\d+|M\d{2,4}|\d{3,4}|\d{6,10})\b/gi;
  const protectedText=text.replace(pattern,m=>{const i=tokens.push(m)-1;return `ZZTOKEN${i}ZZ`;});
  return {protectedText,tokens};
}
function restoreTokens(text,tokens){ return tokens.reduce((out,t,i)=>out.replace(new RegExp(`ZZTOKEN${i}ZZ`,'gi'),t),text); }

async function onlineTranslate(text){
  const clean=normalize(text); if(!clean) return clean;
  const {protectedText,tokens}=protectTokens(clean);
  try{
    const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(protectedText.slice(0,480))}&langpair=en|no`;
    const r=await fetch(url,{headers:{'Accept':'application/json'}});
    if(!r.ok) throw new Error('HTTP '+r.status);
    const data=await r.json();
    let translated=data?.responseData?.translatedText;
    if(!translated || typeof translated!=='string') throw new Error('Tomt oversettelsessvar');
    translated=restoreTokens(translated,tokens);
    return translated.replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
  }catch(e){ return localTranslate(clean); }
}

async function translateItems(items){
  if(!fullTranslate.checked) return items.map(localTranslate);
  const out=[];
  for(const item of items) out.push(await onlineTranslate(item));
  return out;
}

const rx={
  threat:/\b(enemy|hostile|opfor|threat|reserve|armor|armour|obstacle|mine|ied|patrol|observation|defend|occupy|reinforce|counter ?attack|strongpoint|bunker|position)\b/i,
  direction:/\b(north|south|east|west|northeast|northwest|southeast|southwest|left|right|front|rear|from|toward|towards|onto|through|via|route|axis|approach|direction|avenue|corridor|PL\s+\w+|RP\s+\w+|OBJ\s+\w+|ORP\s+\w+)\b/i,
  formation:/\b(formation|column|wedge|file|staggered|echelon|line|order of march|lead|leading|follow|follows|behind|front|rear|left|right|support element|assault element|security element|reserve|first|second|third|fourth|1[- ]?papa|2[- ]?papa|3[- ]?papa|4[- ]?papa|3\/4\s*papa|1\/2\s*papa)\b/i,
  method:/\b(move|maneuver|manoeuvre|advance|clear|secure|seize|assault|breach|support by fire|sbf|block|screen|defend|hold|occupy|establish|report|follow|isolate|destroy|attack|support|fix|suppress|push|break through|bound|cross|capture|take|phase|task|purpose|intent|ready to)\b/i,
  final:/\b(breach|entry|entrance|door|gate|fire|roe|pid|initiate|execute|step[- ]?off|h[- ]?hour|signal|on order|when|nlt|time|channel|radio|report|trigger|commence|codeword|code word|go on|start on)\b/i,
  missionVerb:/\b(clear|secure|seize|assault|attack|defend|hold|support|screen|block|destroy|occupy|capture|take|breach|move|maneuver|manoeuvre|follow)\b/i
};

function classify(lines, keys){
  return lines.map((raw,idx)=>{
    const line=normalize(raw); const own=mentions(line,keys);
    const score = {
      own: own ? 10 : 0,
      threat: rx.threat.test(line) ? 3 : 0,
      direction: rx.direction.test(line) ? 3 : 0,
      formation: rx.formation.test(line) ? 3 : 0,
      method: rx.method.test(line) ? 3 : 0,
      final: rx.final.test(line) ? 3 : 0,
      mission: rx.missionVerb.test(line) ? 3 : 0,
      orderword: /\b(will|shall|must|is to|are to|tasked|on order|be prepared to|ready to)\b/i.test(line) ? 2 : 0,
      place: /\b(?:OBJ|RP|PL|ORP|LD|LOA)\s*[A-Z0-9-]+\b/i.test(line) ? 2 : 0,
      unit: /\b[1-4]\s*[-/]?\s*PAPA\b|\bPAPA\s*[1-4]\b/i.test(line) ? 2 : 0
    };
    return {line,idx,score};
  }).filter(x=>x.line);
}

function pick(items, scoreFn, limit=6, min=1){
  return uniq(items.map(x=>({...x,total:scoreFn(x)})).filter(x=>x.total>=min)
    .sort((a,b)=>b.total-a.total||a.idx-b.idx).slice(0,limit).sort((a,b)=>a.idx-b.idx).map(x=>x.line));
}

function ownTasks(sectionObjects, keys){
  const pool=[...sectionObjects.mission,...sectionObjects.execution,...sectionObjects.other];
  return uniq(pool.filter(x=>x.score.own && (x.score.method || x.score.mission || x.score.orderword)).map(x=>x.line)).slice(0,8);
}

function nearbyContext(lines, keys){
  const out=[];
  for(let i=0;i<lines.length;i++){
    if(mentions(lines[i],keys)){
      for(const j of [i-1,i,i+1]) if(j>=0&&j<lines.length) out.push(normalize(lines[j]));
    }
  }
  return uniq(out);
}

function buildRawIRFMI(s, keys){
  const c={}; for(const k of Object.keys(s)) c[k]=classify(s[k],keys);
  const direct=ownTasks(c,keys);

  // I – Innledning: kort fiendebilde + oppdrag/hensikt for eget lag.
  let intro=uniq([
    ...pick(c.situation,x=>x.score.own + x.score.threat + (x.score.place?1:0),4,2),
    ...pick(c.mission,x=>x.score.own*2 + x.score.mission + x.score.orderword + x.score.place,3,3)
  ]).slice(0,6);
  if(!intro.length) intro=uniq([...s.mission,...s.situation].map(normalize)).slice(0,4);

  // R – Retning: prioriter eget lag, fra/til/via, OBJ/PL/RP og retningsord.
  let direction=uniq([
    ...pick(c.execution,x=>x.score.own*2 + x.score.direction*3 + x.score.place*2 + x.score.orderword,7,4),
    ...pick(c.mission,x=>x.score.own*2 + x.score.direction*2 + x.score.place*2,3,3),
    ...pick(c.situation,x=>x.score.own + x.score.direction*2 + x.score.place,3,3)
  ]).slice(0,7);
  if(!direction.length){
    direction=uniq([...nearbyContext(s.execution,keys),...nearbyContext(s.mission,keys)]).filter(x=>rx.direction.test(x)).slice(0,6);
  }

  // F – Formasjon/gruppering: rekkefølge, hvem foran/bak, støtte/angrep/sikring og lagkombinasjoner.
  let formation=uniq([
    ...pick(c.execution,x=>x.score.own + x.score.formation*4 + x.score.unit*2 + x.score.orderword,7,4),
    ...pick(c.mission,x=>x.score.own + x.score.formation*3 + x.score.unit*2,3,3)
  ]).slice(0,7);
  if(!formation.length){
    formation=uniq(nearbyContext(s.execution,keys)).filter(x=>rx.formation.test(x) || /\b[1-4]\s*[-/]?\s*PAPA\b/i.test(x)).slice(0,6);
  }

  // M – Metode: direkte oppgaver først, deretter handlinger i execution.
  let method=uniq([
    ...direct,
    ...pick(c.execution,x=>x.score.own*2 + x.score.method*3 + x.score.orderword + x.score.place,10,4),
    ...pick(c.mission,x=>x.score.own*2 + x.score.mission*2 + x.score.orderword,4,4)
  ]).slice(0,12);
  if(!method.length) method=uniq([...s.mission,...s.execution].map(normalize)).slice(0,8);

  // I – Innbrudd/ild/iverksettelse: eksplisitte triggere, ROE, breach, tid, samband.
  let final=uniq([
    ...pick(c.execution,x=>x.score.own + x.score.final*4 + x.score.orderword + x.score.place,8,4),
    ...pick(c.command,x=>x.score.own + x.score.final*4 + x.score.orderword,6,3)
  ]).slice(0,9);
  if(!final.length) final=uniq([...s.command,...s.execution].map(normalize)).filter(x=>rx.final.test(x)).slice(0,7);

  return {direct,intro,direction,formation,method,final};
}

function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function block(letter,title,items){const a=uniq(items);return `<section class="order-section"><h4><span class="irfmi-letter">${letter}</span>${title}</h4>${a.length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="empty-note">Ikke tydelig angitt i overordnet ordre.</p>'}</section>`;}

async function generate(){
  const text=orderInput.value.trim(); if(!text){status.textContent='Lim inn en ordre først.';orderInput.focus();return;}
  const btn=$('generateBtn'); btn.disabled=true; const old=btn.textContent; btn.textContent='Behandler…';
  status.textContent=fullTranslate.checked?'Filtrerer ordre og oversetter til norsk…':'Filtrerer ordre…';
  try{
    const s=parseSections(text),keys=keywordSet(),unit=currentUnit();
    const raw=buildRawIRFMI(s,keys);
    const [task,intro,direction,formation,method,final]=await Promise.all([
      translateItems(raw.direct),translateItems(raw.intro),translateItems(raw.direction),translateItems(raw.formation),translateItems(raw.method),translateItems(raw.final)
    ]);

    result.classList.remove('empty');
    result.innerHTML=`<div class="order-title"><h3>${esc(unit)} – IRFMI</h3><p>Lagførers minimumsordre • filtrert fra engelsk 5-punktsordre • norsk kortversjon</p></div>
      ${task.length?`<section class="order-section critical"><h4>DIREKTE OPPGAVE TIL ${esc(unit)}</h4><ul>${task.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
      ${block('I','Innledning',intro)}
      ${block('R','Retning',direction)}
      ${block('F','Formasjon / gruppering',formation)}
      ${block('M','Metode / kort plan',method)}
      ${block('I','Innbrudd • ildledelse • iverksettelse',final)}
      <div class="warning"><strong>Kontroller mot originalordren før bruk.</strong> Automatisk filtrering og maskinoversettelse kan overse kontekst eller spesielle formuleringer.</div>`;
    status.textContent=fullTranslate.checked?`Ferdig – ${unit} er filtrert og oversatt til norsk.`:`Ferdig – ${unit} er filtrert med lokal terminologi.`;
  }catch(e){
    console.error(e); status.textContent='Kunne ikke behandle ordren. Prøv igjen.';
  }finally{btn.disabled=false;btn.textContent=old;}
}

function toText(){
  const out=[result.querySelector('.order-title h3')?.innerText||'IRFMI',''];
  result.querySelectorAll('.order-section').forEach(sec=>{out.push(sec.querySelector('h4')?.innerText||'');[...sec.querySelectorAll('li')].forEach(li=>out.push(`- ${li.innerText}`));if(!sec.querySelector('li'))out.push('- Ikke tydelig angitt i overordnet ordre.');out.push('');});
  return out.join('\n').trim();
}

$('generateBtn').onclick=generate;
$('copyBtn').onclick=async()=>{if(result.classList.contains('empty'))return;await navigator.clipboard.writeText(toText());status.textContent='IRFMI kopiert.';};
$('printBtn').onclick=()=>window.print();
$('themeBtn').onclick=()=>document.body.classList.toggle('light');
$('clearBtn').onclick=()=>{orderInput.value='';result.className='order-card empty';result.innerHTML='<div class="placeholder"><div class="crosshair">◎</div><p>IRFMI vises her.</p></div>';status.textContent='Klar for ordre.';};
$('exampleBtn').onclick=()=>{
  unitSelect.value='4-Papa'; customWrap.classList.add('hidden'); aliasesInput.value='Papa 4, PAPA-4, 4PAPA';
  orderInput.value=`1. SITUATION\nEnemy forces are defending OBJ IRON with a reinforced squad. Expect observation posts north of the village and light patrols on Route RED. Civilian presence is possible. Friendly forces: 1-Papa establishes support by fire west of OBJ IRON.\n\n2. MISSION\n4-Papa clears the eastern compound and secures Building 4 NLT 1530 in order to open Route RED for follow-on forces.\n\n3. EXECUTION\nCommander's intent: isolate the objective, destroy resistance and retain freedom of movement along Route RED. 4-Papa moves from RP BRAVO at 1500, follows the creek line, breaches the east gate, clears east to west and secures Building 4. Alpha Team leads from RP BRAVO. Bravo Team follows and establishes 360 security after LOA. 4-Papa reports OBJ secure. Do not advance west of PL BLUE without platoon approval. ROE: PID required.\n\n4. SUSTAINMENT\nPlatoon CCP is at RP BRAVO. CASEVAC through platoon net. Ammo resupply after OBJ secure.\n\n5. COMMAND & SIGNAL\nPlatoon net: CH 1. Squad internal: CH 3. 4-Papa callsign: PAPA 4. Succession: Squad Leader, Team Leader Alpha, Team Leader Bravo. Initiate assault on order from Platoon Leader.`;
  status.textContent='Engelsk eksempel for 4-Papa lastet inn.';
};
