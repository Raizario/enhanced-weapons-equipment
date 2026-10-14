import { MODULE_ID } from './constants.js';
import { masteryState, labelMastery } from './mastery.js';

const getProps = item => item.system.properties instanceof Set ? [...item.system.properties] : [...(item.system.properties ?? [])];
const round5 = n => Math.ceil(n / 5) * 5;
const controlled = new Set(['defensive','parry']);
const switching = new Set();
/** Switches the selected mastery, persisting the effective property selection and range. */
export async function synchronizeMastery(item, { announce=false, next=null }={}) {
 if (item?.type !== 'weapon' || switching.has(item.uuid)) return;
 const flags = item.flags?.[MODULE_ID] ?? {};
 const state = masteryState(flags);
 const props = new Set(getProps(item));
 const combination = props.has('combination');
 const chosen = next ?? state.active;
 if (!['first','second'].includes(chosen)) return;
 const prior = flags.runtimeActive ?? '';
 const originalProps = flags.runtimeBaseProperties;
 const base = Array.isArray(originalProps) ? new Set(originalProps) : new Set(getProps(item));
 // Runtime mastery properties must never become permanent baseline properties.
 const key = chosen === 'first' ? state.first : state.second;
 const effective = new Set(base);
 if (state.enabled && key) effective.add(key);
 const range = item.system.range ?? {};
 const baselineRange = flags.runtimeBaseRange ?? {value:range.value,long:range.long};
 let ranged = { ...baselineRange };
 if (state.enabled && key === 'farshot') {
   for (const prop of ['value','long']) {
     const value = Number(baselineRange[prop]);
     if (Number.isFinite(value) && value > 0) ranged[prop] = round5(value * 1.5);
   }
 }
 const update = { [`flags.${MODULE_ID}.runtimeActive`]:state.enabled ? chosen : '',
                  [`flags.${MODULE_ID}.runtimeBaseProperties`]:[...base],
                  [`flags.${MODULE_ID}.runtimeBaseRange`]:baselineRange };
 if (state.active !== chosen) update[`flags.${MODULE_ID}.masteryActive`] = chosen;
 if (JSON.stringify([...props].sort()) !== JSON.stringify([...effective].sort())) update['system.properties']=[...effective];
 for (const prop of ['value','long']) if (ranged[prop] !== undefined && String(range[prop] ?? '') !== String(ranged[prop] ?? '')) update[`system.range.${prop}`]=ranged[prop];
 const changed = prior !== (state.enabled ? chosen : '');
 switching.add(item.uuid);
 try {
   if (Object.keys(update).some(k=>k !== `flags.${MODULE_ID}.runtimeActive` && k !== `flags.${MODULE_ID}.runtimeBaseProperties` && k !== `flags.${MODULE_ID}.runtimeBaseRange`) || !flags.runtimeBaseProperties) await item.update(update);
   if (announce && changed && item.actor) {
     const previousKey = prior === 'second' ? state.second : state.first;
     const previousDie = prior === 'second' ? state.secondDie : state.firstDie;
     const selectedDie = chosen === 'second' ? state.secondDie : state.firstDie;
     const from = prior ? labelMastery(previousKey,previousDie) : 'No active mastery';
     const to = state.enabled ? labelMastery(key,selectedDie) : 'No active mastery';
     const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
     const actorName = escape(item.actor.name || 'The wielder');
     const fromName = escape(from);
     const toName = escape(to);
     const narrative = combination
       ? `<p><em>${actorName} shifts ${escape(item.name)} into a new fighting form, leaving <strong>${fromName}</strong> behind and assuming <strong>${toName}</strong>!</em></p>`
       : `<p><em>${actorName} fluidly shifts mastery stance, relinquishing <strong>${fromName}</strong> and embracing <strong>${toName}</strong>!</em></p>`;
     await ChatMessage.create({ speaker:ChatMessage.getSpeaker({actor:item.actor}),
       content:`<div class="ewe-mastery-announcement">${narrative}</div>` });
   }
 } finally { switching.delete(item.uuid); }
}
export function registerMasteryRuntime(){
 Hooks.on('updateItem', (item, change) => {
   if (item.type !== 'weapon' || switching.has(item.uuid)) return;
   const flagsChange = foundry.utils.getProperty(change,`flags.${MODULE_ID}`);
   if (!flagsChange || !['masteryFirst','masterySecond','masteryFirstDie','masterySecondDie','masteryEnabled','masteryActive'].some(k=>Object.hasOwn(flagsChange,k))) return;
   // Defer until the sheet update is finished; avoid nested updates in the hook.
   void synchronizeMastery(item).catch(e=>console.error(`${MODULE_ID} | mastery update`,e));
 });
}
