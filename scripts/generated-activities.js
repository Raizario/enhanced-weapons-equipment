/** dnd5e 6.x utility activities for Enhanced Weapons. No Midi-QOL required. */
import { MODULE_ID } from './constants.js';
import { masteryState } from './mastery.js';
import { synchronizeMastery } from './mastery-runtime.js';

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
  const set = new Set(props instanceof Set ? props : (props ?? []));
  const mastery = masteryState(item.flags?.[MODULE_ID] ?? {});
  if (mastery.enabled) {
    if (mastery.first) set.add(mastery.first);
    if (mastery.second) set.add(mastery.second);
  }
  const list = [];
  if (mastery.enabled && mastery.first && mastery.second && mastery.first !== mastery.second) {
    const speed = String(item.flags?.[MODULE_ID]?.combinationSpeed || 'standard').toLowerCase();
    const combo = set.has('combination');
    // Fast profile switching is a free object interaction or Bonus Action: represented by Bonus Action for usability.
    const type = combo && speed === 'slow' ? 'action' : 'bonus';
    list.push(['mastery-switch', combo ? 'Change Weapon Profile' : 'Switch Mastery Stance', type,
      combo ? `Transform into the other weapon profile (${speed} Combination speed). This activity changes the active Mastery; complete weapon profile damage changes are not automated yet.` :
        'Change your active Weapon Mastery to the other configured Mastery Property.']);
  }
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
      if (!keys.has(kind)) await activity.delete();
    }
    for (const [kind, name, activation, explanation] of wanted) {
      const current = existing.find(a => a.flags[MODULE_ID].generatedKind === kind);
      const data = {
        name,
        type: 'utility',
        activation: { type: activation, value: 1, override: true },
        description: { chatFlavor: explanation },
        flags: { [MODULE_ID]: { generatedKind: kind } }
      };
      if (current) {
        if (current.name !== name || current.activation?.type !== activation) {
          await current.update({name, 'activation.type': activation, 'activation.override': true});
        }
      } else {
        await item.createActivity('utility', data, {renderSheet:false});
      }
    }
  } catch (error) {
    console.error(`${MODULE_ID} | Unable to generate activities on ${item.name}`,error);
  } finally { inflight.delete(item.uuid); }
}

export function registerGeneratedActivities() {
  Hooks.on('dnd5e.postUseActivity', (activity) => {
    const kind = activity?.flags?.[MODULE_ID]?.generatedKind;
    if (kind !== 'mastery-switch') return;
    const item = activity.item;
    // The activity may be an execution clone; resolve to the authoritative embedded item.
    const original = item?.actor?.items?.get(item.id) ?? item;
    if (!original?.actor) return;
    const flags = original.flags?.[MODULE_ID] ?? {};
    const state = masteryState(flags);
    const next = state.active === 'first' ? 'second' : 'first';
    void synchronizeMastery(original, {next, announce:true}).catch(error => console.error(`${MODULE_ID} | Mastery activity`, error));
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
