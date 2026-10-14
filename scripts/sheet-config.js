import { MODULE_ID } from './constants.js';

// V14/ApplicationV2 sheets receive an HTMLElement; older sheets may pass jQuery.
export function registerSheetInjection() {
  const render = (sheet, html) => {
    const item = sheet.item ?? sheet.document;
    if (item?.type !== 'weapon') return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector('.ewe-config')) return;
    const props = item.system.properties;
    const has = key => props instanceof Set ? props.has(key) : Array.isArray(props) && props.includes(key);
    const fields = [];
    const addSelect = (key,label,choices,fallback) => {
      if (!has(key)) return;
      const name = key === 'lacerate' ? 'lacerateDie' : 'combinationSpeed';
      const val = item.getFlag(MODULE_ID,name) ?? fallback;
      fields.push(`<label>${label}<select data-ewe-field="${name}">${choices.map(([v,t])=>`<option value="${v}" ${String(val)===String(v)?'selected':''}>${t}</option>`).join('')}</select></label>`);
    };
    const addText = (key,label,name,defaultValue,type='text') => {
      if (!has(key)) return;
      const val = String(item.getFlag(MODULE_ID,name) ?? defaultValue).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
      fields.push(`<label>${label}<input data-ewe-field="${name}" type="${type}" value="${val}"></label>`);
    };
    addSelect('lacerate','Lacerate starting die',[[4,'d4'],[6,'d6'],[8,'d8'],[10,'d10'],[12,'d12']],6);
    addText('flexible','Flexible damage','flexibleDamage','1d4');
    addText('momentum','Momentum damage','momentumDamage','2d6');
    addText('loud','Loud radius (feet)','loudFeet',500,'number');
    addSelect('combination','Combination speed',[['Fast','Fast'],['Standard','Standard'],['Slow','Slow']],'Standard');
    if (!fields.length) return;
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'ewe-config';
    fieldset.innerHTML = `<legend>Enhanced Weapons & Equipment</legend><p>Values save when changed and update the generated description.</p>${fields.join('')}`;
    fieldset.style.cssText = 'margin:12px 0;padding:10px;border:1px solid var(--color-border-light-primary,#888);display:grid;gap:8px';
    const anchor = root.querySelector('[data-tab="details"].tab, .tab[data-tab="details"], .sheet-body') ?? root;
    anchor.append(fieldset);
    fieldset.addEventListener('change', async event => {
      const input = event.target.closest('[data-ewe-field]');
      if (!input) return;
      const key = input.dataset.eweField;
      const val = ['lacerateDie','loudFeet'].includes(key) ? Number(input.value) : input.value;
      try { await item.setFlag(MODULE_ID,key,val); }
      catch(err) { ui.notifications.error(`Could not save ${key}: ${err.message}`); }
    });
  };
  Hooks.on('renderItemSheet5e', render);
  Hooks.on('renderItemSheet', render);
}
