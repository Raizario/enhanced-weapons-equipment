import { MODULE_ID } from './constants.js';
import { MASTERY_OPTIONS, masteryState } from './mastery.js';
import { synchronizeMastery } from './mastery-runtime.js';

export function registerSheetInjection() {
 const render = (sheet, html) => {
  const item = sheet.item ?? sheet.document;
  if (item?.type !== 'weapon') return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector('.ewe-config')) return;
  const props = item.system.properties;
  const has = key => props instanceof Set ? props.has(key) : Array.isArray(props) && props.includes(key);
  const state = masteryState(item.flags?.[MODULE_ID]);
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
  text('flexible','Flexible damage','flexibleDamage','1d4');
  text('momentum','Momentum damage','momentumDamage','2d6');
  text('loud','Loud radius (feet)','loudFeet',500,'number');
  select('combinationSpeed','Combination speed',[['Fast','Fast'],['Standard','Standard'],['Slow','Slow']],'Standard',has('combination'));
  select('masteryEnabled','Weapon Mastery',[['false','No (default)'],['true','Yes']],state.enabled ? 'true' : 'false');
  if (state.enabled) {
    const propsList = [['','— Select a property —'], ...MASTERY_OPTIONS.map(key => [key,game.i18n.localize(`EWE.Property.${key}`)])];
    select('masteryFirst','Mastery I',propsList,'');
    select('masterySecond','Mastery II',propsList,'');
    if (state.first === 'lacerate') select('masteryFirstDie','Mastery I Lacerate die',[[4,'d4'],[6,'d6'],[8,'d8'],[10,'d10'],[12,'d12']],6);
    if (state.second === 'lacerate') select('masterySecondDie','Mastery II Lacerate die',[[4,'d4'],[6,'d6'],[8,'d8'],[10,'d10'],[12,'d12']],6);
    // Normal weapon stances can switch via bonus action. Combination weapon stances follow the profile.
    select('masteryActive', has('combination') ? 'Current combination profile / active mastery' : 'Active mastery (manual until Activity added)',[['first',has('combination')?'Primary profile — Mastery I':'Mastery I'],['second',has('combination')?'Secondary profile — Mastery II':'Mastery II']],state.active);
  }
  if (state.enabled && state.first && state.second) fields.push('<button type="button" class="ewe-switch-mastery">Switch ' + (has('combination') ? 'Profile' : 'Mastery') + ' (send to chat)</button>');
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'ewe-config';
  fieldset.innerHTML = `<legend>Enhanced Weapons & Equipment</legend><p>Values save when changed and update the generated description.</p>${fields.join('')}`;
  fieldset.style.cssText = 'margin:12px 0;padding:10px;border:1px solid var(--color-border-light-primary,#888);display:grid;gap:8px';
  const anchor = root.querySelector('[data-tab="details"].tab, .tab[data-tab="details"], .sheet-body') ?? root;
  anchor.append(fieldset);
  fieldset.querySelector('.ewe-switch-mastery')?.addEventListener('click', async () => {
   try { await synchronizeMastery(item,{announce:true,next:state.active === 'first' ? 'second' : 'first'}); sheet.render(); }
   catch (e) { console.error(e); ui.notifications.error(`Switch failed: ${e.message}`); }
  });
  fieldset.addEventListener('change', async event => {
   const input = event.target.closest('[data-ewe-field]');
   if (!input) return;
   const key = input.dataset.eweField;
   const val = ['lacerateDie','loudFeet','masteryFirstDie','masterySecondDie'].includes(key) ? Number(input.value) : key === 'masteryEnabled' ? input.value === 'true' : input.value;
   try { await item.setFlag(MODULE_ID,key,val); sheet.render(); }
   catch(err) { ui.notifications.error(`Could not save ${key}: ${err.message}`); }
  });
 };
 Hooks.on('renderItemSheet5e', render);
 Hooks.on('renderItemSheet', render);
}
