const $ = id => document.getElementById(id);
const unitSelect = $('unitName'), customUnit = $('customUnit'), customWrap = $('customWrap');
const aliasesInput = $('roleKeywords'), orderInput = $('orderInput'), result = $('result'), status = $('status');
unitSelect.addEventListener('change', () => customWrap.classList.toggle('hidden', unitSelect.value !== 'custom'));

const headings = {
  situation: [/^\s*1[\).:\-]?\s*(situation|situasjon)\b/i, /^\s*(situation|situasjon)\s*[:\-]?\s*$/i],
  mission: [/^\s*2[\).:\-]?\s*(mission|oppdrag)\b/i, /^\s*(mission|oppdrag)\s*[:\-]?\s*$/i],
  execution: [/^\s*3[\).:\-]?\s*(execution|utførelse|gjennomføring)\b/i, /^\s*(execution|utførelse|gjennomføring)\s*[:\-]?\s*$/i],
  sustainment: [/^\s*4[\).:\-]?\s*(sustainment|admin(?:istration)?(?:\s*(?:&|and)\s*logistics)?|logistics|administrasjon|forsyning)\b/i],
  command: [/^\s*5[\).:\-]?\s*(command(?:\s*(?:&|and)\s*signal)?|signal|ledelse|samband)\b/i, /^\s*(command\s*(?:&|and)?\s*signal|ledelse\s*(?:&|og)?\s*samband)\s*[:\-]?\s*$/i]
};
const subsectionRx = /^(?:[a-z]\. |[a-z]\.|\([a-z]\)|\d+\)|\d+\.|[IVX]+\.|[A-Z][A-Z ]{2,20}:)\s*/i;
function normalize(s){return String(s||'').replace(/^\s*[-•*]+\s*/,'').replace(subsectionRx,'').replace(/\s+/g,' ').trim();}
function splitSentences(line){const c=normalize(line); if(!c)return[]; return c.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(normalize).filter(Boolean);}
function parseSections(text){const s={situation:[],mission:[],execution:[],sustainment:[],command:[],other:[]};let cur='other';for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(!line)continue;let hit=false;for(const [key,pats] of Object.entries(headings)){for(const p of pats){if(p.test(line)){cur=key;hit=true;const after=line.replace(p,'').replace(/^\s*[:\-–—]\s*/,'').trim();if(after)s[cur].push(...splitSentences(after));break;}}if(hit)break;}if(!hit)s[cur].push(...splitSentences(line));}return s;}
function currentUnit(){return unitSelect.value==='custom'?(customUnit.value.trim()||'MITT LAG'):unitSelect.value;}
function unitNumber(unit){const m=unit.match(/^(\d+)/);return m?m[1]:'';}
function canon(s){return String(s||'').toLowerCase().replace(/[–—]/g,'-').replace(/[^a-z0-9æøå/\-]+/g,' ').replace(/\s+/g,' ').trim();}
function uniq(a){const seen=new Set();return a.filter(x=>{const k=canon(x);if(!k||seen.has(k))return false;seen.add(k);return true;});}
function keywordSet(){const u=currentUnit();const n=unitNumber(u);const out=[u,u.replace(/-/g,' '),u.replace(/-/g,'')];if(n)out.push(`Papa ${n}`,`${n} Papa`,`${n}P`,`${n}PAPA`,`P${n}`);for(const x of aliasesInput.value.split(/[,;|]/).map(x=>x.trim()).filter(Boolean))out.push(x);return uniq(out);}
function mentions(line,keys){const l=canon(line);if(keys.some(k=>{const kk=canon(k);return kk&&(l.includes(kk)||l.replace(/\s/g,'').includes(kk.replace(/\s/g,'')));}))return true;const n=unitNumber(currentUnit());if(!n)return false; // combined notation: 3/4 Papa, 1/2 Papa etc.
  const rx=new RegExp(`\\b(?:[1-4]\\s*\\/\\s*)*${n}(?:\\s*\\/\\s*[1-4])*\\s*[- ]?papa\\b`,'i');
  return rx.test(line);
}
function clean(line){return normalize(line).replace(/^P\d+\s*:\s*/i,'').replace(/^T\d+\s*:\s*/i,'').replace(/\b(?:I assess|I believe|we assess|it is assessed that)\b[^,.]*[,.:]?\s*/gi,'').replace(/\s+/g,' ').trim();}
function places(s){return [...s.matchAll(/\b(?:OBJ|RP|PL|ORP|LD|LOA)\s*[A-Z0-9-]+\b|\bOLD CASTLE\b|\b[A-Z][A-Z0-9_-]{2,}\b/g)].map(m=>m[0]).filter((v,i,a)=>a.indexOf(v)===i).filter(x=>!['TFN','NATO','SBF','AA','AS','HQ','IOT'].includes(x));}
function lastPlace(s){const p=places(s);return p[p.length-1]||'';}
function norwegianTargets(s){const t=[];if(/\b(?:AA|anti[- ]?air|air defen[cs]e)\b/i.test(s))t.push('luftvern (AA)');if(/\b(?:AS|anti[- ]?ship|anti[- ]?surface)\b/i.test(s))t.push('sjømålsvåpen (AS)');if(/\bHQ\b/i.test(s))t.push('HQ');return uniq(t);}
function otherPapa(s,unit){const me=unitNumber(unit);const hits=[...s.matchAll(/\b([1-4])\s*[- ]?papa\b/ig)].map(m=>m[1]).filter(n=>n!==me);return hits[0]?`${hits[0]}-Papa`:'';}
function commandFrom(line,unit){const s=clean(line);const p=lastPlace(s);const other=otherPapa(s,unit);
  // Never return raw source text. Every return below is Norwegian command form.
  if(/\b(?:support by fire|sbf|supporting fire)\b/i.test(s)) return `Støtt med ild${p?' mot '+p:''}`;
  if(/\b(?:breach|breaches|breaching|break through|broke through|broken into|bryte inn|brutt seg inn)\b/i.test(s)) return `Bryt inn${p?' ved '+p:''}`;
  if(/\b(?:clear|clears|clearing)\b/i.test(s)) return `Rydd${p?' '+p:''}`;
  if(/\b(?:secure|secures|securing)\b/i.test(s)) return `Sikre${p?' '+p:''}`;
  if(/\b(?:assault|attack|attacks|attacking|angripe|angrip)\b/i.test(s)) return `Angrip${p?' '+p:''}`;
  if(/\b(?:follow|follows|following|følge|følg)\b/i.test(s)) return `Følg${other?' '+other:''}`;
  if(/\b(?:support|supports|supporting|støtte|støtt)\b/i.test(s)) return `Støtt${other?' '+other:''}${p?' ved '+p:''}`;
  if(/\b(?:move|moves|moving|maneuver|manoeuvre|advance|push|fremrykk)\b/i.test(s)) return `Fremrykk${p?' mot '+p:''}`;
  if(/\b(?:hold|holds|holding)\b/i.test(s)) return `Hold${p?' '+p:''}`;
  if(/\b(?:defend|defends|defending)\b/i.test(s)) return `Forsvar${p?' '+p:''}`;
  if(/\b(?:destroy|destroys|destroying|bekjempe|bekjemp)\b/i.test(s)){const t=norwegianTargets(s);return `Bekjemp${t.length?' '+t.join(' og '):''}${p?' ved '+p:''}`;}
  if(/\b(?:report|reports|reporting|meld)\b/i.test(s)){if(/secure/i.test(s))return 'Meld OBJ SECURE';return 'Meld status';}
  if(/\b(?:establish|establishes|establishing)\b/i.test(s)&&/360/.test(s)) return 'Etabler 360° sikring';
  return '';
}
function routeFrom(line){const s=clean(line),p=places(s);if(p.length>=2)return p.slice(0,3).join(' → ');const dirs=[['north','nord'],['south','sør'],['east','øst'],['west','vest'],['left','venstre'],['right','høyre']];for(const [e,n] of dirs)if(new RegExp(`\\b${e}\\b`,'i').test(s)&&p.length)return `${n} mot ${p[0]}`;return '';}
function formationFrom(line,unit){const s=clean(line);const me=unitNumber(unit);let m=s.match(/\b([1-4])\s*[- ]?papa\b[^.]{0,50}\b(?:front|lead|first|foran)\b/i);if(m)return `${m[1]}-Papa foran`;m=s.match(/\b(?:follow|follows|following|behind|følger)\b[^.]{0,20}\b([1-4])\s*[- ]?papa\b/i);if(m&&m[1]!==me)return `${unit} følger ${m[1]}-Papa`;if(new RegExp(`\\b3\\s*\\/\\s*4\\s*[- ]?papa\\b`,'i').test(s)&&me==='4')return '4-Papa følger 3-Papa';if(/1[- ]?papa.*2[- ]?papa.*(?:front|foran)/i.test(s))return '1-Papa / 2-Papa foran';return '';}
function finalFrom(line,unit){const s=clean(line);if(/on order.*(?:platoon leader|\bPL\b)|på ordre.*(?:PL|tropp)/i.test(s))return 'Iverksett på ordre fra PL';if(/PID required|PID kreves/i.test(s))return 'PID kreves';if(/report.*secure|meld.*secure/i.test(s))return 'Meld OBJ SECURE';const ch=s.match(/\bCH\s*\d+\b/i);if(ch)return `Samband ${ch[0].toUpperCase()}`;return '';}
function takeCommands(lines,unit,max){const out=[];for(const line of lines){if(!mentions(line,keywordSet()))continue;const c=commandFrom(line,unit);if(c&&!out.includes(c))out.push(c);if(out.length>=max)break;}return out;}
function compactIRFMI(s,unit){
  const intro=[]; // only direct mission/task, never generic enemy paragraphs
  for(const line of [...s.mission,...s.execution]){if(!mentions(line,keywordSet()))continue;const c=commandFrom(line,unit);if(c){intro.push(c);break;}}
  const direction=[];for(const line of [...s.execution,...s.mission]){if(!mentions(line,keywordSet()))continue;const r=routeFrom(line);if(r){direction.push(r);break;}}
  const formation=[];for(const line of [...s.execution,...s.mission]){if(!mentions(line,keywordSet()))continue;const f=formationFrom(line,unit);if(f&&!formation.includes(f))formation.push(f);if(formation.length>=2)break;}
  const method=takeCommands([...s.execution,...s.mission],unit,3).filter((x,i,a)=>a.indexOf(x)===i);
  const final=[];for(const line of [...s.execution,...s.command]){const f=finalFrom(line,unit);if(f&&!final.includes(f))final.push(f);if(final.length>=2)break;}
  return {intro:intro.slice(0,1),direction:direction.slice(0,1),formation:formation.slice(0,2),method:method.slice(0,3),final:final.slice(0,2)};
}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function block(letter,title,items){const a=uniq(items);return `<section class="order-section"><h4><span class="irfmi-letter">${letter}</span>${title}</h4>${a.length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="empty-note">Ikke tydelig angitt.</p>'}</section>`;}
async function generate(){const text=orderInput.value.trim();if(!text){status.textContent='Lim inn en ordre først.';return;}const btn=$('generateBtn');btn.disabled=true;btn.textContent='Behandler…';try{const s=parseSections(text),unit=currentUnit(),o=compactIRFMI(s,unit);result.classList.remove('empty');result.innerHTML=`<div class="order-title"><h3>${esc(unit)} – IRFMI</h3><p>Kort muntlig minimumsordre</p></div>${block('I','Innledning',o.intro)}${block('R','Retning',o.direction)}${block('F','Formasjon / gruppering',o.formation)}${block('M','Metode / kort plan',o.method)}${block('I','Innbrudd • ildledelse • iverksettelse',o.final)}<div class="warning"><strong>Kontroller mot originalordren.</strong> Kun korte norske kommandoer vises.</div>`;status.textContent=`Ferdig – ${unit} filtrert til norsk IRFMI.`;}catch(e){console.error(e);status.textContent='Kunne ikke behandle ordren.';}finally{btn.disabled=false;btn.textContent='Generer IRFMI';}}
function toText(){const out=[result.querySelector('.order-title h3')?.innerText||'IRFMI',''];result.querySelectorAll('.order-section').forEach(sec=>{out.push(sec.querySelector('h4')?.innerText||'');[...sec.querySelectorAll('li')].forEach(li=>out.push(`- ${li.innerText}`));if(!sec.querySelector('li'))out.push('- Ikke tydelig angitt.');out.push('');});return out.join('\n').trim();}
$('generateBtn').onclick=generate;$('copyBtn').onclick=async()=>{if(result.classList.contains('empty'))return;await navigator.clipboard.writeText(toText());status.textContent='IRFMI kopiert.';};$('printBtn').onclick=()=>window.print();$('themeBtn').onclick=()=>document.body.classList.toggle('light');$('clearBtn').onclick=()=>{orderInput.value='';result.className='order-card empty';result.innerHTML='<div class="placeholder"><div class="crosshair">◎</div><p>IRFMI vises her.</p></div>';status.textContent='Klar for ordre.';};
$('exampleBtn').onclick=()=>{unitSelect.value='4-Papa';customWrap.classList.add('hidden');aliasesInput.value='Papa 4, 4PAPA';orderInput.value=`1. SITUATION\nEnemy motorized infantry is fortified west of OLD CASTLE.\n\n2. MISSION\nThird troop will destroy enemy AA and AS in OLD CASTLE. 4-Papa attacks OLD CASTLE and supports the assault.\n\n3. EXECUTION\n3/4 Papa breach OLD CASTLE. 4-Papa follows 3-Papa and clears the eastern side. SBF supports 3/4 Papa. 4-Papa reports OBJ secure.\n\n5. COMMAND & SIGNAL\nInitiate on order from Platoon Leader. PID required.`;status.textContent='Eksempel lastet.';};
