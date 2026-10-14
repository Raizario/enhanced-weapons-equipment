import { MODULE_ID } from './constants.js';
import { masteryState, labelMastery } from './mastery.js';
import { profileState, nativeDamagePatch, profileProperties } from './profiles.js';

const busy = new Set();
const propertyArray = item => [...(item.system.properties ?? [])];
const round5 = n => Math.ceil(n / 5) * 5;
const escapeHtml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const own = (o, k) => Object.prototype.hasOwnProperty.call(o ?? {}, k);

export function permanentProperties(item) {
 const f = item.flags?.[MODULE_ID] ?? {};
 const current = new Set(propertyArray(item));
 const base = new Set(Array.isArray(f.runtimeBaseProperties) ? f.runtimeBaseProperties : current);
 const state = masteryState(f);
 if (f.combinationEnabled) return new Set(Array.isArray(f.profileBaseProperties) ? f.profileBaseProperties : [...current].filter(p => p !== 'combination'));
 // Recover Combination when an earlier release stripped it; only when the saved speed explicitly exists.
 if (f.combinationSpeed && !current.has('combination')) base.add('combination');
 const old = f.runtimeActive === 'second' ? state.second : state.first;
 // Repair old 0.1.9 data, where a temporary mastery could be cached as permanent.
 if (old && !f.runtimeBaseProperties?.includes(old) && current.has(old)) current.delete(old);
 // Add any properties changed manually since last sync, but don't import the temporary active mastery.
 const previousExpected = new Set(base);
 if (f.runtimeActive && old) previousExpected.add(old);
 for (const p of current) if (!previousExpected.has(p)) base.add(p);
 for (const p of previousExpected) if (!current.has(p) && p !== old && !(p === 'combination' && f.combinationSpeed)) base.delete(p);
 return base;
}

/** Stable switch: never allows a selected mastery to replace permanent properties. */
export async function synchronizeMastery(item, { announce=false, next=null }={}) {
 if (item?.type !== 'weapon' || busy.has(item.uuid)) return;
 const flags = item.flags?.[MODULE_ID] ?? {};
 const state = masteryState(flags);
 const chosen = next ?? state.active;
 if (!['first','second'].includes(chosen)) return;
 const current = new Set(propertyArray(item));
 const base = permanentProperties(item);
 const combo = base.has('combination') || !!flags.combinationEnabled;
 const profile = profileState(item);
 const profileMode = combo && state.mode === 'combination';
 const previous = combo && flags.combinationEnabled ? (flags.profileActive || 'first') : (flags.runtimeActive || state.active);
 const prior = flags.runtimeActive || state.active;
 const masteryChoice = state.mode === 'combination' && combo ? chosen : state.active;
 const key = state.enabled ? (masteryChoice === 'second' ? state.second : state.first) : '';
 const effective = combo && flags.combinationEnabled ? profileProperties(profile, chosen) : new Set(base);
 if (combo && flags.combinationEnabled) effective.add('combination');
 if (key) effective.add(key);
 const originalRange = flags.runtimeBaseRange ?? {value:item.system.range?.value,long:item.system.range?.long};
 const range = { ...originalRange };
 if (key === 'farshot') for (const p of ['value','long']) {
   const v = Number(originalRange[p]);
   if (Number.isFinite(v) && v > 0) range[p] = round5(v * 1.5);
 }
 const update = {
   [`flags.${MODULE_ID}.runtimeBaseProperties`]:[...base],
   [`flags.${MODULE_ID}.runtimeActive`]: state.enabled ? chosen : '',
   [`flags.${MODULE_ID}.runtimeBaseRange`]:originalRange
 };
 if (chosen !== state.active && (!combo || profileMode)) update[`flags.${MODULE_ID}.masteryActive`] = chosen;
 if (combo && flags.combinationEnabled) {
   update[`flags.${MODULE_ID}.profileActive`] = chosen;
   Object.assign(update, nativeDamagePatch(item, profile, chosen));
 }
 if (JSON.stringify([...current].sort()) !== JSON.stringify([...effective].sort())) update['system.properties']=[...effective];
 for (const p of ['value','long']) if (range[p] !== undefined && String(item.system.range?.[p] ?? '') !== String(range[p] ?? '')) update[`system.range.${p}`]=range[p];
 busy.add(item.uuid);
 try {
   await item.update(update);
   if (announce && previous !== chosen && item.actor) {
     const fromKey = previous === 'second' ? state.second : state.first;
     const fromDie = prior === 'second' ? state.secondDie : state.firstDie;
     const toDie = chosen === 'second' ? state.secondDie : state.firstDie;
     const actor = escapeHtml(item.actor.name || 'The wielder');
     const from = escapeHtml(labelMastery(fromKey,fromDie));
     const to = escapeHtml(labelMastery(key,toDie));
     const text = combo && flags.combinationEnabled && (state.mode!=='yes' || chosen!==state.active)
       ? `<em>${actor} transforms <strong>${escapeHtml(item.name)}</strong>, shifting from its <strong>${previous === 'first'?'primary':'secondary'}</strong> configuration to its <strong>${chosen === 'first'?'primary':'secondary'}</strong> form!</em>`
       : `<em>${actor} fluidly shifts mastery stance, relinquishing <strong>${from}</strong> and embracing <strong>${to}</strong>!</em>`;
     await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor:item.actor}),content:`<p class="ewe-stance-message">${text}</p>`});
   }
 } finally { busy.delete(item.uuid); }
}

export function registerMasteryRuntime() {
 Hooks.on('updateItem',(item, changes) => {
   if (item.type !== 'weapon' || busy.has(item.uuid)) return;
   const f = foundry.utils.getProperty(changes,`flags.${MODULE_ID}`);
   const relevant = !!f && ['masteryEnabled','masteryFirst','masterySecond','masteryFirstDie','masterySecondDie','masteryActive','masteryMode','combinationEnabled','profilePrimary','profileSecondary'].some(k => own(f,k));
   if (relevant) void synchronizeMastery(item).catch(e=>console.error(`${MODULE_ID} | sync`,e));
 });
}

/** Switch an independent mastery without transforming a Combination weapon profile. */
export async function switchIndependentMastery(item) {
 const flags=item.flags?.[MODULE_ID]??{};
 const state=masteryState(flags);
 if(state.mode!=='yes') return;
 const next=state.active==='first'?'second':'first';
 await item.update({[`flags.${MODULE_ID}.masteryActive`]:next});
 if(flags.combinationEnabled) {
   await synchronizeMastery(item,{next:flags.profileActive??'first',announce:false});
   if(item.actor){
     const from=escapeHtml(labelMastery(state.active==='first'?state.first:state.second,state.active==='first'?state.firstDie:state.secondDie));
     const to=escapeHtml(labelMastery(next==='first'?state.first:state.second,next==='first'?state.firstDie:state.secondDie));
     await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:item.actor}),content:`<p><em>${escapeHtml(item.actor.name)} shifts mastery stance, relinquishing <strong>${from}</strong> and embracing <strong>${to}</strong>!</em></p>`});
   }
 }
}
