import { MODULE_ID } from "./constants.js";

// Concise play-facing restatements of the v1.7.1 rules, not automations.
export const PROPERTY_RULES = {
 adaptable:"Advantage on opportunity attacks made with this weapon.",
 agile:"When wielded in two hands, use Strength or Dexterity for both attack and damage rolls.",
 attached:"Secured to your hand, wrist, or forearm; normally cannot be disarmed. You can attack with it only when that hand is otherwise unoccupied. Donning or doffing takes an action unless stated otherwise.",
 bludgeon:"On a critical hit against a creature wearing armor, roll one additional weapon damage die when determining the critical hit's extra damage.",
 brace:"When a creature you see willingly moves into this weapon's reach, you can use your reaction to make a melee attack against it.",
 brawler:"After attacking with this weapon as part of the Attack action, you can use a bonus action to shove or grapple that opponent.",
 brutal:"On a critical hit, roll one additional weapon damage die when determining the critical hit's extra damage.",
 bulky:"Disadvantage on attacks against targets within 10 feet.",
 bypass:"Ignore the AC bonus granted by a target's shield when attacking it with this weapon.",
 combination:"This weapon has two profiles; only its current profile's damage, properties, and special rules apply. Switching profiles takes an object interaction or bonus action (Fast), a bonus action (Standard), or an action (Slow).",
 covert:"If hidden, missing with this weapon does not reveal your position.",
 cumbersome:"Use Strength for both attack and damage rolls.",
 defensive:"While wielding this weapon without a tower shield, gain +1 AC.",
 deflect:"When a creature within 5 feet hits you with an attack, use your reaction to reduce its damage by 1d4 + your proficiency bonus (minimum 0).",
 demolish:"On a hit, this weapon deals double damage to objects and structures.",
 disarm:"Replace one attack from the Attack action with a disarming attack against a target at most one size larger within reach. Contest your attack roll against its Athletics or Acrobatics. On success, deal no damage and knock a held item into an unoccupied space within 10 feet. Your attack has disadvantage if the item is held in two hands; its check has advantage if larger than you, disadvantage if smaller.",
 drag:"Replace one attack from the Attack action with a dragging attack against a target at most one size larger within reach or range. Contest your attack roll against its Athletics or Acrobatics. On success, deal no damage and pull it up to 10 feet in a direction you choose.",
 execute:"On a hit against an incapacitated, paralyzed, restrained, surprised, or unconscious creature, roll one additional weapon damage die.",
 flense:"On a critical hit against an unarmored creature, roll one additional weapon damage die when determining the critical hit's extra damage.",
 flexible:"After attacking with this weapon as part of the Attack action, use a bonus action to attack with another part of it, dealing the configured bludgeoning, piercing, or slashing damage.",
 flourish:"When wielding this weapon in two hands, before your first attack of the Attack action, make a DC 13 Strength or Dexterity check (add proficiency bonus if proficient with the weapon). Success: +2 to your first attack roll with it this turn. Failure: take damage of its type equal to your proficiency bonus.",
 hidden:"May be concealed inside a boot, gauntlet, sleeve, staff, hat, cane, or similar place. Draw, deploy, or conceal as a bonus action; discovering it requires DC 20 Investigation.",
 lacerate:"On a hit, apply a Laceration die to the target. Further hits increase its current die one step (d4 → d6 → d8 → d10 → d12), regardless of the new weapon's starting die. At the start of the target's turn, it takes slashing damage equal to the die, which then steps down; after a d4 tick it ends. Hitting at d12 instead immediately deals 1d4 slashing damage. Only one die per creature; this damage is separate from the attack. An action and a successful DC 13 Medicine check ends it.",
 liquidate:"On a critical hit against a submerged creature, roll one additional weapon damage die when determining the critical hit's extra damage.",
 loud:"Discharging this weapon alerts hearing creatures within the configured distance; double that distance in strongly echoing or sound-conducting environments, including underwater.",
 momentum:"After moving at least 20 feet straight toward a creature during this turn, on a hit you can replace this weapon's normal damage dice with the configured Momentum dice. Once per turn.",
 mount:"On a hit while mounted, roll one additional weapon damage die.",
 nimble:"When using this weapon as your off-hand weapon in two-weapon fighting, add your ability modifier to that attack's damage.",
 parry:"While wielding this weapon and another one-handed Finesse weapon, gain +1 AC.",
 penetrate:"On a critical hit against a creature with natural armor, roll one additional weapon damage die when determining the critical hit's extra damage.",
 repeater:"After attacking with this weapon as part of the Attack action, make another attack with it as a bonus action, even if it has Loading.",
 swift:"When you miss, gain advantage on your next attack with the same weapon against the same target.",
 trip:"Replace one attack from the Attack action with a tripping attack against a target at most one size larger within reach. Contest your attack roll against its Athletics or Acrobatics. On success, deal normal weapon damage and knock it prone. Its check has advantage if larger than you, disadvantage if smaller.",
 unwieldy:"After your first attack with this weapon on your turn, further attacks with it before your next turn have disadvantage. Ignore this property with Strength 24 or higher.",
 farshot:"Increase both normal and long ranges by 50%, rounding down to the nearest 5 feet."
};
const START = '<!-- ewe-properties:start -->';
const END = '<!-- ewe-properties:end -->';
const escapeText = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const values = {lacerate:'lacerateDie',flexible:'flexibleDamage',momentum:'momentumDamage',loud:'loudFeet',combination:'combinationSpeed'};
function listProperties(properties) { return properties instanceof Set ? [...properties] : Array.isArray(properties) ? properties : []; }
function originalOnly(html) {
 const begin = html.indexOf(START), end = html.indexOf(END);
 if (begin < 0 || end < begin) return html;
 return (html.slice(0,begin) + html.slice(end + END.length)).trimEnd();
}
function decorate(base, properties, flags) {
 const rows = listProperties(properties).filter(p => p in PROPERTY_RULES).sort().map(p => {
  let value = flags?.[values[p]];
  if (p === 'lacerate') value = `d${value ?? 6}`;
  if (p === 'loud') value = `${value ?? 500} ft.`;
  if (p === 'combination') value ??= 'Standard';
  const title = game.i18n.localize(`EWE.Property.${p}`);
  return `<li><strong>${escapeText(title)}${value ? ` (${escapeText(value)})` : ''}.</strong> ${escapeText(PROPERTY_RULES[p])}</li>`;
 });
 return rows.length ? `${base}\n${START}<section class="ewe-generated-properties"><h3>Weapon Properties</h3><ul>${rows.join('')}</ul></section>${END}` : base;
}
export function registerPropertyDescriptions() {
 Hooks.on('preUpdateItem', (item, change) => {
  if (item.type !== 'weapon') return;
  const g = foundry.utils.getProperty;
  const updatedProperties = g(change,'system.properties');
  const updatedDescription = g(change,'system.description.value');
  const incomingFlags = g(change,`flags.${MODULE_ID}`);
  if (updatedProperties === undefined && updatedDescription === undefined && !incomingFlags) return;
  const allFlags = foundry.utils.mergeObject(foundry.utils.deepClone(item.flags?.[MODULE_ID] ?? {}), incomingFlags ?? {}, {inplace:false});
  const source = originalOnly(String(updatedDescription ?? item.system.description?.value ?? ''));
  foundry.utils.setProperty(change,'system.description.value',decorate(source,updatedProperties ?? item.system.properties, allFlags));
 });
 // Existing weapons get refreshed only when edited. Use this from console to backfill:
 game.modules.get(MODULE_ID).api ??= {};
 game.modules.get(MODULE_ID).api.refreshDescriptions = async (items) => {
  for (const item of items) if (item.type === 'weapon') await item.update({'system.description.value':item.system.description?.value ?? ''});
 };
}
