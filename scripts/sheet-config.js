import { MODULE_ID } from './constants.js';
import { MASTERY_OPTIONS, masteryState } from './mastery.js';
import { synchronizeMastery } from './mastery-runtime.js';
import { profileState, KEYS } from './profiles.js';

/** Locate the existing dnd5e weapon-property checkbox grid without rewriting its inputs. */
function applyThreeColumnPropertyLayout(root) {
 const checkboxes = [...root.querySelectorAll('input[type="checkbox"]')]
  .filter(el => (el.name || '').includes('properties'));
 if (checkboxes.length < 9) return;
 // The smallest element shared by the property checkboxes is the grid container
 // on the official dnd5e sheet. Do not modify unrelated sheet fields.
 const parents = [];
 for (let node = checkboxes[0].parentElement; node && node !== root; node = node.parentElement) {
  if (checkboxes.every(c => node.contains(c))) { parents.push(node); break; }
 }
 let group = parents[0];
 if (!group) return;
 // A checkbox's own label may be wrapped; if the shared node has a single
 // inner grid carrying all checkboxes, use that inner grid instead.
 while (group.children.length === 1 && group.firstElementChild?.querySelectorAll('input[type="checkbox"]').length >= 9) {
  group = group.firstElementChild;
 }
 // Never turn the entire Details tab into a grid.
 if (group.matches('.tab, .sheet-body, form, .window-content, fieldset')) {
  const child = [...group.children].find(el => el.querySelectorAll('input[type="checkbox"]').length >= 9);
  if (!child) return;
  group = child;
 }
 group.classList.add('ewe-three-column-properties');
}

export function registerSheetInjection() {
 const render = (sheet, html) => {
  const item = sheet.item ?? sheet.document;
  if (item?.type !== 'weapon') return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  applyThreeColumnPropertyLayout(root);
  if (root.querySelector('.ewe-config')) return;
  const escapeAttr=v=>String(v??'').replaceAll('&','&amp;').replaceAll('\"','&quot;').replaceAll('<','&lt;');
  const props = item.system.properties;
  const has = key => props instanceof Set ? props.has(key) : Array.isArray(props) && props.includes(key);
  const state = masteryState(item.flags?.[MODULE_ID]);
  const comboEnabled=!!(item.getFlag(MODULE_ID,'combinationEnabled') || has('combination'));
  const profiles=profileState(item);
  const fields = [];
  const select = (name,label,choices,fallback,visible=true) => {
   if (!visible) return;
   const val = item.getFlag(MODULE_ID,name) ?? fallback;
   fields.push(`<label>${label}<select data-ewe-field="${name}">${choices.map(([v,t])=>`<option value="${v}" ${String(val)===String(v)?'selected':''}>${t}</option>`).join('')}</select></label>`);
  };
  const text = (key,label,name,defaultValue,type='text') => {
   if (!has(key)) return;
   const val = String(item.getFlag(MODULE_ID,name) ?? defaultValue).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
   fields.push(`<label>${label}<input data-ewe-field="${name}" type="${type}" value="${val}"></label>`);
  };
  select('lacerateDie','Lacerate starting die',[[4,'d4'],[6,'d6'],[8,'d8'],[10,'d10'],[12,'d12']],6,has('lacerate'));
  const addAttackDamage = (property,label,defaults)=>{
    if(!has(property) && !comboEnabled) return;
    const stored=item.getFlag(MODULE_ID,`${property}Attack`)??defaults;
    fields.push(`<details class="ewe-profile"><summary>${label} — Attack Damage</summary>
      <label><input type="checkbox" data-ewe-attack="${property}:formulaMode" ${stored.formulaMode?'checked':''}> Custom formula</label>
      <div class="ewe-damage-fields" ${stored.formulaMode?'hidden':''}><label>Number<input type="number" min="0" data-ewe-attack="${property}:number" value="${stored.number}"></label>
      <label>Die<select data-ewe-attack="${property}:die">${['d4','d6','d8','d10','d12','d20'].map(v=>`<option ${stored.die===v?'selected':''}>${v}</option>`).join('')}</select></label>
      <label>Bonus<input data-ewe-attack="${property}:bonus" value="${escapeAttr(stored.bonus)}"></label></div>
      <label ${stored.formulaMode?'':'hidden'}>Formula<input data-ewe-attack="${property}:formula" value="${escapeAttr(stored.formula)}"></label>
      <label>Damage type<select data-ewe-attack="${property}:type">${['slashing','piercing','bludgeoning'].map(v=>`<option ${stored.type===v?'selected':''}>${v}</option>`).join('')}</select></label></details>`);
  };
  addAttackDamage('flexible','Flexible',{formulaMode:false,number:1,die:'d4',bonus:'',formula:'',type:'bludgeoning'});
  addAttackDamage('momentum','Momentum',{formulaMode:false,number:2,die:'d6',bonus:'',formula:'',type:'slashing'});
  text('loud','Loud radius (feet)','loudFeet',500,'number');
  select('combinationSpeed','Combination speed',[['Fast','Fast'],['Standard','Standard'],['Slow','Slow']],'Standard',has('combination'));
  select('masteryMode','Weapon Mastery',[['no','No (default)'],['yes','Yes — independent stances'],['combination','Combination — tied to profiles']],state.mode);
  if (state.enabled) {
    const propsList = [['','— Select a property —'], ...MASTERY_OPTIONS.map(key => [key,game.i18n.localize(`EWE.Property.${key}`)])];
    select('masteryFirst','Mastery I',propsList,'');
    select('masterySecond','Mastery II',propsList,'');
    if (state.first === 'lacerate') select('masteryFirstDie','Mastery I Lacerate die',[[4,'d4'],[6,'d6'],[8,'d8'],[10,'d10'],[12,'d12']],6);
    if (state.second === 'lacerate') select('masterySecondDie','Mastery II Lacerate die',[[4,'d4'],[6,'d6'],[8,'d8'],[10,'d10'],[12,'d12']],6);
    // Normal weapon stances can switch via bonus action. Combination weapon stances follow the profile.
    if (state.mode==='yes') select('masteryActive','Active Mastery', [['first','Mastery I'],['second','Mastery II']],state.active);
  }
  if (state.mode==='yes' && state.first && state.second) fields.push('<button type="button" class="ewe-switch-mastery">Switch ' + 'Mastery' + ' (send to chat)</button>');
  const profileSelect=(which, profile)=>{
    const opts=KEYS.map(key=>`<option value="${key}">${game.i18n.localize(`EWE.Property.${key}`)}</option>`).join('');
    const chips=profile.properties.map(key=>`<button type="button" class="ewe-chip" data-ewe-remove="${which}:${key}">${game.i18n.localize(`EWE.Property.${key}`)} ×</button>`).join('');
    const d=profile.damage;
    return `<details class="ewe-profile" open><summary>${which==='first'?'Primary':'Secondary'} Weapon Profile</summary>
      <label>Profile name<input data-ewe-profile="${which}:name" value="${escapeAttr(profile.name)}"></label>
      <label>Properties (add one at a time)<select data-ewe-add="${which}"><option value="">+ Add a property...</option>${opts}</select></label>
      <div class="ewe-chips">${chips||'<small>No properties yet</small>'}</div>
      <label><input type="checkbox" data-ewe-profile="${which}:damage.formulaMode" ${d.formulaMode?'checked':''}> Use custom damage formula</label>
      <div class="ewe-damage-fields" ${d.formulaMode?'hidden':''}>
         <label>Number<input type="number" min="0" data-ewe-profile="${which}:damage.number" value="${escapeAttr(d.number)}"></label>
         <label>Die<select data-ewe-profile="${which}:damage.die">${['d4','d6','d8','d10','d12','d20'].map(v=>`<option ${d.die===v?'selected':''}>${v}</option>`).join('')}</select></label>
         <label>Modifier<input data-ewe-profile="${which}:damage.bonus" value="${escapeAttr(d.bonus)}"></label>
      </div>
      <label ${d.formulaMode?'':'hidden'}>Formula<input data-ewe-profile="${which}:damage.formula" value="${escapeAttr(d.formula)}" placeholder="2d6 + @mod"></label>
      <label>Damage type<select data-ewe-profile="${which}:damage.type">${['slashing','piercing','bludgeoning','fire','cold','lightning','force','necrotic','radiant','poison','psychic','acid','thunder'].map(v=>`<option value="${v}" ${d.type===v?'selected':''}>${v}</option>`).join('')}</select></label>
    </details>`;
  };
  fields.unshift(`<label>Combination weapon<select data-ewe-field="combinationEnabled"><option value="false" ${comboEnabled?'':'selected'}>No</option><option value="true" ${comboEnabled?'selected':''}>Yes — two profiles</option></select></label>`);
  if(comboEnabled){
    fields.push(profileSelect('first',profiles.first),profileSelect('second',profiles.second));
    fields.push(`<label>Current weapon profile<select data-ewe-field="profileActive"><option value="first" ${(item.getFlag(MODULE_ID,'profileActive')??'first')==='first'?'selected':''}>Primary</option><option value="second" ${item.getFlag(MODULE_ID,'profileActive')==='second'?'selected':''}>Secondary</option></select></label>`);
  }
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'ewe-config';
  fieldset.innerHTML = `<legend>Enhanced Weapons & Equipment</legend><p>Values save when changed and update the generated description.</p>${fields.join('')}`;
  fieldset.style.cssText = 'margin:12px 0;padding:10px;border:1px solid var(--color-border-light-primary,#888);display:grid;gap:8px';
  const anchor = root.querySelector('[data-tab="details"].tab, .tab[data-tab="details"], .sheet-body') ?? root;
  anchor.append(fieldset);
  if(comboEnabled){
    const checks=[...root.querySelectorAll('input[type="checkbox"]')].filter(el=>(el.name||'').includes('properties'));
    if(checks.length>=9){let target=checks[0].parentElement;while(target && target!==root && !checks.every(el=>target.contains(el)))target=target.parentElement;
      if(target && !target.matches('form,.tab,.sheet-body,fieldset,.window-content')) target.style.display='none';}
  }
  const saveProfile=async(which,field,value)=>{
     const next=structuredClone(profiles[which]);
     if(field.startsWith('damage.'))next.damage[field.slice(7)]=value;else next[field]=value;
     await item.setFlag(MODULE_ID,which==='first'?'profilePrimary':'profileSecondary',next);sheet.render();
  };
  fieldset.addEventListener('click',async event=>{
    const btn=event.target.closest('[data-ewe-remove]');if(!btn)return;
    const [which,key]=btn.dataset.eweRemove.split(':');const next=structuredClone(profiles[which]);next.properties=next.properties.filter(x=>x!==key);
    await item.setFlag(MODULE_ID,which==='first'?'profilePrimary':'profileSecondary',next);sheet.render();
  });
  fieldset.addEventListener('change',async event=>{
    const add=event.target.closest('[data-ewe-add]');
    if(add&&add.value){const which=add.dataset.eweAdd;const next=structuredClone(profiles[which]);next.properties=[...new Set([...next.properties,add.value])];await item.setFlag(MODULE_ID,which==='first'?'profilePrimary':'profileSecondary',next);sheet.render();return;}
    const attack=event.target.closest('[data-ewe-attack]');
    if(attack){const [type,key]=attack.dataset.eweAttack.split(':');const defaults={formulaMode:false,number:type==='momentum'?2:1,die:type==='momentum'?'d6':'d4',bonus:'',formula:'',type:type==='flexible'?'bludgeoning':'slashing'};
      const updated={...defaults,...(item.getFlag(MODULE_ID,`${type}Attack`)??{})};updated[key]=attack.type==='checkbox'?attack.checked:attack.type==='number'?Number(attack.value):attack.value;
      await item.setFlag(MODULE_ID,`${type}Attack`,updated);sheet.render();return;}
    const control=event.target.closest('[data-ewe-profile]');if(!control)return;
    const [which,...parts]=control.dataset.eweProfile.split(':');const field=parts.join(':');
    const val=control.type==='checkbox'?control.checked:control.type==='number'?Number(control.value):control.value;
    await saveProfile(which,field,val);
  });
  fieldset.querySelector('.ewe-switch-mastery')?.addEventListener('click', async () => {
   try { await synchronizeMastery(item,{announce:true,next:state.active === 'first' ? 'second' : 'first'}); sheet.render(); }
   catch (e) { console.error(e); ui.notifications.error(`Switch failed: ${e.message}`); }
  });
  fieldset.addEventListener('change', async event => {
   const input = event.target.closest('[data-ewe-field]');
   if (!input) return;
   const key = input.dataset.eweField;
   const val = ['lacerateDie','loudFeet','masteryFirstDie','masterySecondDie'].includes(key) ? Number(input.value) : key === 'combinationEnabled' ? input.value === 'true' : input.value;
   try { if(key==='combinationEnabled' && val && !item.getFlag(MODULE_ID,'profileBaseProperties')) await item.setFlag(MODULE_ID,'profileBaseProperties',[...item.system.properties].filter(p=>p!=='combination')); await item.setFlag(MODULE_ID,key,val); if(key==='profileActive')await synchronizeMastery(item,{next:val,announce:false}); sheet.render(); }
   catch(err) { ui.notifications.error(`Could not save ${key}: ${err.message}`); }
  });
 };
 Hooks.on('renderItemSheet5e', render);
 Hooks.on('renderItemSheet', render);
}
