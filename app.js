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

// v2.7: IRFMI skal ikke ord-for-ord-oversettes. Den omskrives til korte norske ordrelinjer.
function cleanMilitary(line){
  return normalize(line)
    .replace(/^P\d+\s*:\s*/i,'')
    .replace(/^T\d+\s*:\s*/i,'')
    .replace(/\b(?:I assess|I believe|we assess|it is assessed that)\b[^,.]*[,.:]?\s*/gi,'')
    .replace(/\b(?:in order to|so that)\b.*$/i,'')
    .replace(/\s+/g,' ').trim();
}

function noUnitPrefix(s, unit){
  const aliases=[unit,unit.replace(/-/g,' '),unit.replace(/-/g,'')];
  let x=s;
  for(const a of aliases){
    const r=new RegExp('^'+a.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\s*[:\\-–—]?\\s*','i');
    x=x.replace(r,'');
  }
  return x.trim();
}

function placeTokens(s){
  return [...s.matchAll(/\b(?:OBJ|RP|PL|ORP|LD|LOA)\s*[A-Z0-9-]+\b|\bOLD CASTLE\b|\b[A-Z][A-Z0-9_-]{2,}\b/g)]
    .map(m=>m[0]).filter((v,i,a)=>a.indexOf(v)===i);
}

function directionWords(s){
  const out=[];
  const map=[['north','nord'],['south','sør'],['east','øst'],['west','vest'],['left','venstre'],['right','høyre']];
  for(const [e,n] of map) if(new RegExp('\\b'+e+'\\b','i').test(s)) out.push(n);
  return out;
}

function norwegianTargets(s){
  const t=[];
  // Vanlige milsim/NATO-forkortelser i ordretekst.
  if(/\b(?:AA|anti[- ]?air|air defen[cs]e)\b/i.test(s)) t.push('luftvern (AA)');
  if(/\b(?:AS|anti[- ]?ship|anti[- ]?surface)\b/i.test(s)) t.push('sjømålsvåpen (AS)');
  if(/\bHQ\b/i.test(s)) t.push('HQ');
  return [...new Set(t)];
}

function norwegianizeResidual(s){
  // Brukes kun på korte fragmenter. Engelske helsetninger skal aldri vises som fallback.
  return String(s||'')
    .replace(/\bAA\b/gi,'luftvern (AA)')
    .replace(/\banti[- ]?air\b/gi,'luftvern (AA)')
    .replace(/\bair defen[cs]e\b/gi,'luftvern (AA)')
    .replace(/\bAS\b/gi,'sjømålsvåpen (AS)')
    .replace(/\banti[- ]?ship\b/gi,'sjømålsvåpen (AS)')
    .replace(/\banti[- ]?surface\b/gi,'sjømålsvåpen (AS)')
    .replace(/\bsupport\b/gi,'støtt')
    .replace(/\bfollow\b/gi,'følg')
    .replace(/\bsecure\b/gi,'sikre')
    .replace(/\bclear\b/gi,'rydd')
    .replace(/\battack\b/gi,'angrip')
    .replace(/\bbreach\b/gi,'bryt inn')
    .replace(/\bdestroy\b/gi,'bekjemp')
    .replace(/\breport\b/gi,'meld')
    .replace(/\s+/g,' ').trim();
}

function canonicalCommand(line, unit){
  let s=noUnitPrefix(cleanMilitary(line),unit);
  const places=placeTokens(s);
  const p=places.join(' → ');

  const rules=[
    [/\b(?:move|moves|moving|maneuver|manoeuvre|advance|push)\b/i,()=>`Fremrykk${p?' mot '+places[places.length-1]:''}`],
    [/\b(?:follow|follows|following)\b/i,()=>{const m=s.match(/follow(?:s|ing)?\s+([^,.;]+)/i);return `Følg${m?' '+m[1].trim():''}`;}],
    [/\b(?:breach|breaches|breaching|break through|bryte inn)\b/i,()=>`Bryt inn${places.length?' ved '+places[0]:''}`],
    [/\b(?:clear|clears|clearing)\b/i,()=>`Rydd${places.length?' '+places[places.length-1]:''}`],
    [/\b(?:secure|secures|securing)\b/i,()=>`Sikre${places.length?' '+places[places.length-1]:''}`],
    [/\b(?:assault|attack|attacks|attacking)\b/i,()=>`Angrip${places.length?' '+places[places.length-1]:''}`],
    [/\b(?:support by fire|sbf|supporting fire)\b/i,()=>`Støtt med ild${places.length?' mot '+places[places.length-1]:''}`],
    [/\b(?:support|supports|supporting)\b/i,()=>`Støtt${places.length?' ved '+places[places.length-1]:''}`],
    [/\b(?:hold|holds|holding)\b/i,()=>`Hold${places.length?' '+places[places.length-1]:''}`],
    [/\b(?:defend|defends|defending)\b/i,()=>`Forsvar${places.length?' '+places[places.length-1]:''}`],
    [/\b(?:destroy|destroys|destroying)\b/i,()=>{const tg=norwegianTargets(s); return `Bekjemp${tg.length?' '+tg.join(' og '):''}${places.length?' ved '+places[places.length-1]:''}`;}],
    [/\b(?:report|reports|reporting)\b/i,()=>{const m=s.match(/report(?:s|ing)?\s+(.+)/i);return `Meld${m?' '+m[1].trim():''}`;}],
    [/\b(?:establish|establishes|establishing)\b/i,()=>{if(/360/i.test(s))return 'Etabler 360° sikring';return `Etabler${places.length?' ved '+places[places.length-1]:''}`;}],
    [/\b(?:block|blocks|blocking)\b/i,()=>`Blokker${places.length?' '+places[places.length-1]:''}`]
  ];
  for(const [r,f] of rules) if(r.test(s)) return f().replace(/\s+/g,' ').trim();
  return '';
}

function introSummary(lines, unit){
  // Kun informasjon som direkte påvirker valgt lag. Ingen lange fiendebeskrivelser.
  for(const raw of lines){
    const s=cleanMilitary(raw);
    if(!mentions(s,keywordSet())) continue;
    const cmd=canonicalCommand(s,unit);
    if(cmd) return cmd;
  }
  return '';
}

function routeSummary(lines, unit){
  for(const raw of lines){
    const s=cleanMilitary(raw);
    if(!mentions(s,keywordSet())) continue;
    const places=placeTokens(s);
    if(places.length>=2) return places.slice(0,3).join(' → ');
    const d=directionWords(s);
    if(places.length===1 && d.length) return `${d[0]} mot ${places[0]}`;
  }
  return '';
}

function formationSummary(lines, unit){
  const all=lines.map(cleanMilitary);
  for(const s of all){
    if(!mentions(s,keywordSet())) continue;
    let m=s.match(/\b([1-4](?:\s*[-/]?\s*Papa)?)\b[^.]{0,40}\b(?:lead|front|first)\b/i);
    if(m) return `${m[1].replace(/\s+/g,' ')} foran`;
    m=s.match(/\b(?:follow|follows|behind)\s+([1-4](?:\s*[-/]?\s*Papa)?)/i);
    if(m) return `${unit} følger ${m[1].replace(/\s+/g,' ')}`;
    if(/3\/4\s*papa/i.test(s) && /follow|support|ready/i.test(s)) return `${unit} følger 3-Papa`;
    if(/1[- ]?papa.*2[- ]?papa.*front/i.test(s)) return `1-Papa / 2-Papa foran`;
  }
  return '';
}

function finalSummary(lines, unit){
  for(const raw of lines){
    const s=cleanMilitary(raw);
    if(!mentions(s,keywordSet()) && !/platoon leader|PL\b|on order|PID|ROE|report|channel|CH\s*\d+/i.test(s)) continue;
    if(/on order.*platoon leader|on order.*PL\b/i.test(s)) return 'Iverksett på ordre fra PL';
    if(/PID required/i.test(s)) return 'PID kreves';
    if(/report.*secure/i.test(s)) return 'Meld OBJ SECURE';
    if(/\bCH\s*\d+\b/i.test(s)){ const m=s.match(/\bCH\s*\d+\b/i); return `Samband ${m[0]}`; }
  }
  return '';
}

function buildRawIRFMI(s, keys){
  const relevant=[...s.mission,...s.execution,...s.command,...s.other];
  const own=relevant.filter(x=>mentions(x,keys));
  const context=[];
  for(const arr of [s.execution,s.mission]){
    for(let i=0;i<arr.length;i++) if(mentions(arr[i],keys)) for(const j of [i-1,i,i+1]) if(j>=0&&j<arr.length) context.push(arr[j]);
  }
  const pool=uniq([...own,...context]);
  return { pool, own };
}

function compactIRFMI(s, unit){
  const raw=buildRawIRFMI(s,keywordSet());
  const intro=[];
  const mission=introSummary([...s.mission,...raw.own],unit);
  if(mission) intro.push(mission);

  const direction=[];
  const route=routeSummary([...s.execution,...raw.own],unit);
  if(route) direction.push(route);

  const formation=[];
  const f=formationSummary([...s.execution,...s.mission,...raw.pool],unit);
  if(f) formation.push(f);

  const method=[];
  for(const line of [...s.execution,...s.mission]){
    if(!mentions(line,keywordSet())) continue;
    const c=canonicalCommand(line,unit);
    if(c && !method.includes(c)) method.push(c);
    if(method.length>=3) break;
  }

  const final=[];
  const f1=finalSummary([...s.execution,...s.command],unit);
  if(f1) final.push(f1);
  if(!final.some(x=>/Meld/i.test(x))){
    for(const line of [...s.execution,...s.command]){
      if(/report.*secure/i.test(line)){ final.push('Meld OBJ SECURE'); break; }
    }
  }
  return {intro:intro.slice(0,2),direction:direction.slice(0,2),formation:formation.slice(0,2),method:method.slice(0,3),final:final.slice(0,2)};
}

function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function block(letter,title,items){const a=uniq(items);return `<section class="order-section"><h4><span class="irfmi-letter">${letter}</span>${title}</h4>${a.length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="empty-note">Ikke tydelig angitt i overordnet ordre.</p>'}</section>`;}

async function generate(){
  const text=orderInput.value.trim(); if(!text){status.textContent='Lim inn en ordre først.';orderInput.focus();return;}
  const btn=$('generateBtn'); btn.disabled=true; const old=btn.textContent; btn.textContent='Behandler…';
  status.textContent='Filtrerer og komprimerer ordren…';
  try{
    const s=parseSections(text),unit=currentUnit();
    const o=compactIRFMI(s,unit);
    result.classList.remove('empty');
    result.innerHTML=`<div class="order-title"><h3>${esc(unit)} – IRFMI</h3><p>Kort muntlig minimumsordre</p></div>
      ${block('I','Innledning',o.intro)}
      ${block('R','Retning',o.direction)}
      ${block('F','Formasjon / gruppering',o.formation)}
      ${block('M','Metode / kort plan',o.method)}
      ${block('I','Innbrudd • ildledelse • iverksettelse',o.final)}
      <div class="warning"><strong>Kontroller mot originalordren før bruk.</strong> Kortversjonen prioriterer kun det som påvirker valgt lag.</div>`;
    status.textContent=`Ferdig – ${unit} er filtrert til kort norsk IRFMI.`;
  }catch(e){ console.error(e); status.textContent='Kunne ikke behandle ordren. Prøv igjen.'; }
  finally{btn.disabled=false;btn.textContent=old;}
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
