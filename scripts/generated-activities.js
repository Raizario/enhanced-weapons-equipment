/** dnd5e 6.x utility activities for Enhanced Weapons. No Midi-QOL required. */
import { MODULE_ID } from './constants.js';
import { masteryState } from './mastery.js';
import { synchronizeMastery, permanentProperties, switchIndependentMastery } from './mastery-runtime.js';

const inflight = new Set();
const MANEUVERS = {
  brawler: ['Brawler — Shove / Grapple', 'bonus', 'After attacking with this weapon as part of the Attack action, use a Bonus Action to shove or grapple the opponent.'],
  brace: ['Brace — Reactive Strike', 'reaction', 'When a creature you can see willingly moves into your reach, use your Reaction to make one melee weapon attack against it.'],
  deflect: ['Deflect — Reduce Damage', 'reaction', 'When a creature within 5 feet hits you, use your Reaction to reduce damage by 1d4 + proficiency bonus (minimum 0).'],
  disarm: ['Disarm — Special Attack', 'action', 'Replace one attack of the Attack action with a disarming attack, using the contest and size rules in the Enhanced Weapons document. No damage on success.'],
  drag: ['Drag — Special Attack', 'action', 'Replace one attack of the Attack action with a dragging attack, using the contest and size rules in the Enhanced Weapons document. On success, pull the target up to 10 feet.'],
  trip: ['Trip — Special Attack', 'action', 'Replace one attack of the Attack action with a tripping attack, using the contest and size rules in the Enhanced Weapons document. On success, deal weapon damage and knock prone.'],
  flourish: ['Flourish — Opening Maneuver', 'special', 'Before the first attack of your Attack action while wielding this weapon in two hands, make a DC 13 Strength or Dexterity check, adding proficiency if proficient. Success: +2 to the first weapon attack this turn. Failure: take damage equal to proficiency bonus.']
};

function entries(item) {
  const props = item.system?.properties;
  const set = permanentProperties(item);
  // Both possible Masteries contribute maneuver choices; active stance only changes availability at use time.
  const mastery = masteryState(item.flags?.[MODULE_ID] ?? {});
  const combo=!!item.flags?.[MODULE_ID]?.combinationEnabled || set.has('combination');
  if (mastery.enabled) {
    if (mastery.first) set.add(mastery.first);
    if (mastery.second) set.add(mastery.second);
  }
  const list = [];
  if (combo || (mastery.mode==='yes' && mastery.first && mastery.second && mastery.first !== mastery.second)) {
    const speed = String(item.flags?.[MODULE_ID]?.combinationSpeed || 'standard').toLowerCase();
    // Fast profile switching is a free object interaction or Bonus Action: represented by Bonus Action for usability.
    const type = combo && speed === 'slow' ? 'action' : 'bonus';
    list.push(['mastery-switch', combo ? 'Change Weapon Profile' : 'Switch Mastery Stance', type,
      combo ? `Transform into the other weapon profile (${speed} Combination speed). This activity changes the active Mastery; complete weapon profile damage changes are not automated yet.` :
        'Change your active Weapon Mastery to the other configured Mastery Property.']);
  }
  if (combo && mastery.mode === 'yes' && mastery.first && mastery.second && mastery.first!==mastery.second) list.push(['mastery-stance','Switch Mastery Stance','bonus','Change the active Weapon Mastery independently of the weapon profile.']);
  if (set.has('momentum')) list.push(['maneuver-momentum','Momentum — Charging Strike','action','Attack after moving 20 feet straight toward your target; replace base weapon damage dice with Momentum dice. Once per turn.']);
  if (set.has('flexible')) list.push(['maneuver-flexible','Flexible — Follow-up Strike','bonus','After taking the Attack action with this weapon, make the bonus attack using its configured Flexible damage.']);
  for (const [key, [name, activation, text]] of Object.entries(MANEUVERS)) {
    if (set.has(key)) list.push([`maneuver-${key}`, name, activation, text]);
  }
  return list;
}
function managedActivities(item) {
  const col = item.system?.activities;
  const activities = col?.contents ?? (col?.values ? [...col.values()] : []);
  return activities.filter(a => a.flags?.[MODULE_ID]?.generatedKind);
}
export async function synchronizeGeneratedActivities(item) {
  if (item?.type !== 'weapon' || !item.isOwner || !item.createActivity || inflight.has(item.uuid)) return;
  inflight.add(item.uuid);
  try {
    const wanted = entries(item);
    const existing = managedActivities(item);
    const keys = new Set(wanted.map(e => e[0]));
    for (const activity of existing) {
      const kind = activity.flags[MODULE_ID].generatedKind;
      if (!keys.has(kind) && kind !== 'mastery-switch' && !(kind.startsWith('maneuver-') && !item.flags?.[MODULE_ID]?.runtimeBaseProperties)) await activity.delete();
    }
    for (const [kind, name, activation, explanation] of wanted) {
      const current = existing.find(a => a.flags[MODULE_ID].generatedKind === kind);
      const attackKind=['maneuver-momentum','maneuver-flexible'].includes(kind);
      const rule=kind==='maneuver-momentum'?'momentum':'flexible';
      const setting=item.getFlag(MODULE_ID,`${rule}Attack`)??{number:rule==='momentum'?2:1,die:rule==='momentum'?'d6':'d4',bonus:'',type:rule==='momentum'?'slashing':'bludgeoning'};
      const damagePart=setting.formulaMode && setting.formula ?
         {custom:{enabled:true,formula:String(setting.formula)},types:{[setting.type||'slashing']:true}} :
         {number:Number(setting.number)||1,denomination:setting.die||'d6',bonus:String(setting.bonus||''),types:{[setting.type||'slashing']:true}};
      const data = {
        name,
        type: 'utility',
        activation: { type: activation, value: 1, override: true },
        description: { chatFlavor: explanation },
        flags: { [MODULE_ID]: { generatedKind: kind } }
      };
      if(attackKind){
        data.attack={type:{value:item.system.attackType||'melee',classification:'weapon'}};
        data.damage={includeBase:false,parts:[damagePart]};
      }
      if (current && attackKind && current.type!=='attack') { await current.delete(); await item.createActivity('attack',data,{renderSheet:false}); }
      else if (current) {
        if (attackKind) await current.update({'damage.includeBase':false,'damage.parts':[damagePart]});
        if (current.name !== name || current.activation?.type !== activation) {
          await current.update({name, 'activation.type': activation, 'activation.override': true});
        }
      } else {
        await item.createActivity(attackKind?'attack':'utility', data, {renderSheet:false});
      }
    }
  } catch (error) {
    console.error(`${MODULE_ID} | Unable to generate activities on ${item.name}`,error);
  } finally { inflight.delete(item.uuid); }
}

export function registerGeneratedActivities() {
  Hooks.on('dnd5e.postUseActivity', (activity) => {
    const kind = activity?.flags?.[MODULE_ID]?.generatedKind;
    if (!['mastery-switch','mastery-stance'].includes(kind)) return;
    const item = activity.item;
    // The activity may be an execution clone; resolve to the authoritative embedded item.
    const original = item?.actor?.items?.get(item.id) ?? item;
    if (!original?.actor) return;
    const flags = original.flags?.[MODULE_ID] ?? {};
    const state = masteryState(flags);
    const combo=!!flags.combinationEnabled;
    const next = kind==='mastery-stance' ? (state.active==='first'?'second':'first') : combo ? ((flags.profileActive||'first')==='first'?'second':'first') : (state.active==='first'?'second':'first');
    if(kind==='mastery-stance') void switchIndependentMastery(original).catch(error=>console.error(`${MODULE_ID} | Stance activity`,error));
    else void synchronizeMastery(original, {next, announce:true}).catch(error => console.error(`${MODULE_ID} | Mastery activity`, error));
  });
  Hooks.on('updateItem', (item, changes) => {
    if (item.type !== 'weapon' || inflight.has(item.uuid)) return;
    const relevant = 'system' in changes || !!foundry.utils.getProperty(changes, `flags.${MODULE_ID}`);
    if (relevant) void synchronizeGeneratedActivities(item);
  });
  Hooks.on('createItem', item => { if (item.type === 'weapon') void synchronizeGeneratedActivities(item); });
  Hooks.once('ready', () => {
    if (!game.user?.isGM) return;
    for (const item of game.items ?? []) if (item.type === 'weapon') void synchronizeGeneratedActivities(item);
    for (const actor of game.actors ?? []) for (const item of actor.items ?? []) {
      if (item.type === 'weapon') void synchronizeGeneratedActivities(item);
    }
  });
}
