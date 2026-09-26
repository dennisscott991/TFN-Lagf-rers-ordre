const $ = id => document.getElementById(id);
const unitSelect = $('unitName'), customUnit = $('customUnit'), customWrap = $('customWrap');
const aliasesInput = $('roleKeywords'), orderInput = $('orderInput'), result = $('result'), status = $('status');

unitSelect.addEventListener('change', () => customWrap.classList.toggle('hidden', unitSelect.value !== 'custom'));

const headings = {
  situation: [/^\s*1[\).:\-]?\s*(situation|situasjon)/i, /^\s*(situation|situasjon)\s*[:\-]/i],
  mission: [/^\s*2[\).:\-]?\s*(mission|oppdrag)/i, /^\s*(mission|oppdrag)\s*[:\-]/i],
  execution: [/^\s*3[\).:\-]?\s*(execution|utførelse|gjennomføring)/i, /^\s*(execution|utførelse|gjennomføring)\s*[:\-]/i],
  sustainment: [/^\s*4[\).:\-]?\s*(sustainment|admin|log|administration|logistics|administrasjon|forsyning)/i],
  command: [/^\s*5[\).:\-]?\s*(command|signal|ledelse|samband)/i, /^\s*(command\s*(?:&|and)?\s*signal|ledelse\s*(?:&|og)?\s*samband)\s*[:\-]/i]
};

function normalize(s){ return s.replace(/^\s*[-•*]+\s*/, '').replace(/\s+/g,' ').trim(); }
function parseSections(text){
  const s={situation:[],mission:[],execution:[],sustainment:[],command:[],other:[]}; let cur='other';
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim(); if(!line) continue; let hit=false;
    for(const [key, pats] of Object.entries(headings)){
      const p=pats.find(x=>x.test(line)); if(p){cur=key;hit=true;const after=line.replace(p,'').replace(/^\s*[:\-–—]\s*/,'').trim();if(after)s[cur].push(after);break;}
    }
    if(!hit)s[cur].push(line);
  } return s;
}

function currentUnit(){ return unitSelect.value==='custom' ? (customUnit.value.trim()||'MITT LAG') : unitSelect.value; }
function keywordSet(){
  const u=currentUnit();
  const auto=[u, u.replace('-',' '), u.replace('-',''), u.split('-').reverse().join('-')];
  if(/^\d+-Papa$/i.test(u)){ const n=u.split('-')[0]; auto.push(`Papa ${n}`,`Papa-${n}`,`${n} Papa`,`${n}P`); }
  const extra=aliasesInput.value.split(/[,;|]/).map(x=>x.trim()).filter(Boolean);
  return [...new Set([...auto,...extra].filter(Boolean))];
}
function mentions(line,keys){ const l=line.toLowerCase(); return keys.some(k=>l.includes(k.toLowerCase())); }
function uniq(a){ const seen=new Set(); return a.filter(x=>{const k=x.toLowerCase().replace(/[^a-zæøå0-9]/gi,'');if(!k||seen.has(k))return false;seen.add(k);return true;}); }

// Phrase-based military translation. Proper nouns, callsigns, grids and numbers are deliberately retained.
const phrases = [
  [/commander'?s intent/gi,'sjefens intensjon'],[/enemy forces?/gi,'fiendtlige styrker'],[/friendly forces?/gi,'egne styrker'],
  [/support by fire/gi,'støtte med ild'],[/establish(?:es)? (?:a )?support by fire/gi,'etabler støtte med ild'],
  [/seize(?:s|d)?/gi,'ta'],[/secure(?:s|d)?/gi,'sikre'],[/clear(?:s|ed|ing)?/gi,'rydde'],[/defend(?:s|ed|ing)?/gi,'forsvare'],
  [/assault(?:s|ed|ing)?/gi,'angripe'],[/breach(?:es|ed|ing)?/gi,'bryte inn'],[/destroy(?:s|ed|ing)?/gi,'bekjempe'],
  [/move(?:s|d)?/gi,'fremrykk'],[/advance(?:s|d)?/gi,'rykk frem'],[/withdraw(?:s|n)?/gi,'trekk ut'],[/follow(?:s|ed)?/gi,'følg'],
  [/establish(?:es|ed)?/gi,'etabler'],[/hold(?:s|ing)?/gi,'hold'],[/block(?:s|ed|ing)?/gi,'blokker'],[/screen(?:s|ed|ing)?/gi,'overvåk'],
  [/report(?:s|ed)?/gi,'meld'],[/do not/gi,'ikke'],[/without platoon approval/gi,'uten godkjenning fra troppen'],
  [/no later than/gi,'senest'],[/NLT\b/gi,'senest'],[/at squad level/gi,'på lagsnivå'],[/through platoon net/gi,'via troppsnett'],
  [/squad internal/gi,'internt lagsnett'],[/platoon net/gi,'troppsnett'],[/callsign/gi,'kallesignal'],[/succession/gi,'rekkefølge ved bortfall'],
  [/squad leader/gi,'lagfører'],[/team leader alpha/gi,'lagfører Alpha'],[/team leader bravo/gi,'lagfører Bravo'],
  [/challenge\/password/gi,'spørsmål/passord'],[/ammo resupply/gi,'ammunisjonsforsyning'],[/medical supplies/gi,'sanitetsmateriell'],
  [/civilian presence is possible/gi,'sivile kan være til stede'],[/observation posts?/gi,'observasjonsposter'],[/light patrols?/gi,'lette patruljer'],
  [/from the north/gi,'fra nord'],[/from the south/gi,'fra sør'],[/from the east/gi,'fra øst'],[/from the west/gi,'fra vest'],
  [/north of/gi,'nord for'],[/south of/gi,'sør for'],[/east of/gi,'øst for'],[/west of/gi,'vest for'],
  [/east to west/gi,'øst mot vest'],[/west to east/gi,'vest mot øst'],[/north to south/gi,'nord mot sør'],[/south to north/gi,'sør mot nord'],
  [/in order to/gi,'for å'],[/objective/gi,'objekt'],[/route/gi,'akse'],[/building/gi,'bygning'],[/compound/gi,'område'],
  [/platoon/gi,'tropp'],[/squad/gi,'lag'],[/team/gi,'team'],[/radio/gi,'samband'],[/channel/gi,'kanal'],[/frequency/gi,'frekvens'],
  [/rules? of engagement/gi,'engasjementsregler'],[/ROE\b/gi,'ROE'],[/PID required/gi,'positiv identifikasjon kreves'],
  [/360 security/gi,'360° sikring'],[/rally point/gi,'samlepunkt'],[/phase line/gi,'faselinje'],[/line of advance/gi,'fremrykningsakse']
];
function translate(line){ let out=line; for(const [r,repl] of phrases) out=out.replace(r,repl); return out.replace(/\s+/g,' ').trim(); }

const rx={
  direction:/\b(north|south|east|west|northeast|northwest|southeast|southwest|left|right|front|rear|from|toward|towards|via|route|axis|approach|direction|PL\s+\w+|RP\s+\w+|OBJ\s+\w+)\b/i,
  formation:/\b(formation|column|wedge|file|staggered|echelon|line|alpha|bravo|team|element|order of march|lead|follows?|trail|support element|assault element|security element)\b/i,
  method:/\b(move|advance|clear|secure|seize|assault|breach|support by fire|sbf|block|screen|defend|hold|occupy|establish|report|follow|isolate|destroy|attack|maneuver|phase|task|purpose|intent)\b/i,
  final:/\b(breach|entry|entrance|door|gate|fire|roe|pid|initiate|execute|step[- ]?off|h[- ]?hour|signal|on order|when|nlt|time|channel|radio|report|trigger|commence)\b/i,
  sit:/\b(enemy|friendly|civilian|threat|patrol|observation|position|located|defend|occupy|reinforced)\b/i
};

function scored(lines, keys, pattern, limit=6){
  return lines.map((raw,idx)=>{const line=normalize(raw);let score=0;if(mentions(line,keys))score+=8;if(pattern.test(line))score+=3;if(/\b(shall|will|must|is to|tasked to)\b/i.test(line))score+=2;if(/\b\d{3,4}\b/.test(line))score+=1;return{line,score,idx};})
    .filter(x=>x.line&&x.score>0).sort((a,b)=>b.score-a.score||a.idx-b.idx).slice(0,limit).sort((a,b)=>a.idx-b.idx).map(x=>translate(x.line));
}
function direct(lines,keys){ return uniq(lines.map(normalize).filter(l=>mentions(l,keys)).map(translate)).slice(0,8); }
function esc(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function block(letter,title,items){const a=uniq(items);return `<section class="order-section"><h4><span class="irfmi-letter">${letter}</span>${title}</h4>${a.length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="empty-note">Ikke tydelig angitt i overordnet ordre.</p>'}</section>`;}

function generate(){
  const text=orderInput.value.trim(); if(!text){status.textContent='Lim inn en ordre først.';orderInput.focus();return;}
  const s=parseSections(text), keys=keywordSet(), all=Object.values(s).flat(), unit=currentUnit();
  const task=direct(all,keys);
  const intro=uniq([...scored(s.situation,keys,rx.sit,4),...scored(s.mission,keys,rx.method,3)]).slice(0,6);
  const direction=uniq([...scored(s.execution,keys,rx.direction,6),...scored(s.situation,keys,rx.direction,3)]).slice(0,7);
  const formation=scored(s.execution,keys,rx.formation,6);
  const method=uniq([...task,...scored(s.execution,keys,rx.method,9)]).slice(0,10);
  const final=uniq([...scored(s.execution,keys,rx.final,7),...scored(s.command,keys,rx.final,4)]).slice(0,8);
  result.classList.remove('empty');
  result.innerHTML=`<div class="order-title"><h3>${esc(unit)} – IRFMI</h3><p>Lagførers minimumsordre • filtrert fra engelsk 5-punktsordre • norsk kortversjon</p></div>
    ${task.length?`<section class="order-section critical"><h4>DIREKTE OPPGAVE TIL ${esc(unit)}</h4><ul>${task.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
    ${block('I','Innledning',intro)}
    ${block('R','Retning',direction)}
    ${block('F','Formasjon / gruppering',formation)}
    ${block('M','Metode / kort plan',method)}
    ${block('I','Innbrudd • ildledelse • iverksettelse',final)}
    <div class="warning"><strong>Kontroller mot originalordren før bruk.</strong> Automatisk filtrering/oversettelse kan overse kontekst eller spesielle formuleringer.</div>`;
  status.textContent=`Ferdig – filtrert for ${unit} og oversatt til norsk IRFMI.`;
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
  unitSelect.value='4-Papa'; customWrap.classList.add('hidden'); aliasesInput.value='Papa 4, PAPA-4';
  orderInput.value=`1. SITUATION\nEnemy forces are defending OBJ IRON with a reinforced squad. Expect observation posts north of the village and light patrols on Route RED. Civilian presence is possible. Friendly forces: 1-Papa establishes support by fire west of OBJ IRON.\n\n2. MISSION\n4-Papa clears the eastern compound and secures Building 4 NLT 1530 in order to open Route RED for follow-on forces.\n\n3. EXECUTION\nCommander's intent: isolate the objective, destroy resistance and retain freedom of movement along Route RED. 4-Papa moves from RP BRAVO at 1500, follows the creek line, breaches the east gate, clears east to west and secures Building 4. Alpha Team leads from RP BRAVO. Bravo Team follows and establishes 360 security after LOA. 4-Papa reports OBJ secure. Do not advance west of PL BLUE without platoon approval. ROE: PID required.\n\n4. SUSTAINMENT\nPlatoon CCP is at RP BRAVO. CASEVAC through platoon net. Ammo resupply after OBJ secure.\n\n5. COMMAND & SIGNAL\nPlatoon net: CH 1. Squad internal: CH 3. 4-Papa callsign: PAPA 4. Succession: Squad Leader, Team Leader Alpha, Team Leader Bravo. Initiate assault on order from Platoon Leader.`;
  status.textContent='Engelsk eksempel for 4-Papa lastet inn.';
};
