/**
 * Lacerate (X) automation.
 *
 * Storage: a flag on the target actor — flags.enhanced-weapons-equipment.lacerate.die
 * holds the current die size as a plain number of faces (4, 6, 8, 10, 12).
 * A linked Active Effect (status icon "ewe-lacerated") is kept in sync purely
 * for visibility on the token/sheet; the flag is the source of truth.
 */

import { MODULE_ID } from "./constants.js";
import { isLacerateAutomated } from "./settings.js";

const DIE_STEPS = [4, 6, 8, 10, 12];

function stepUp(die) {
  const i = DIE_STEPS.indexOf(die);
  return i === -1 || i === DIE_STEPS.length - 1 ? die : DIE_STEPS[i + 1];
}

function stepDown(die) {
  const i = DIE_STEPS.indexOf(die);
  return i <= 0 ? null : DIE_STEPS[i - 1]; // null = laceration ends
}

/**
 * Call when an attack with a Lacerate-tagged weapon hits `target`.
 * `weaponItem` supplies the starting die (flags.lacerateDie, default d6)
 * and magical bonus (flags.lacerateBonus, default 0) set on the sheet.
 */
export async function applyLacerate(target, weaponItem) {
  if (!isLacerateAutomated()) return;

  const startingDie = weaponItem.getFlag(MODULE_ID, "lacerateDie") ?? 6;
  const bonus = weaponItem.getFlag(MODULE_ID, "lacerateBonus") ?? 0;

  const current = target.getFlag(MODULE_ID, "lacerate.die");
  const newDie = current ? stepUp(current) : startingDie;

  // Laceration Mastery / Reckless Laceration variants can be layered in
  // later by adjusting `newDie` here based on the attacker's feats.

  await target.setFlag(MODULE_ID, "lacerate.die", newDie);
  await target.setFlag(MODULE_ID, "lacerate.bonus", bonus);
  await ensureStatusEffect(target, newDie);
}

async function ensureStatusEffect(actor, die) {
  const existing = actor.effects.find(e => e.getFlag(MODULE_ID, "lacerate"));
  const data = {
    name: `Lacerated (d${die})`,
    icon: "icons/skills/wounds/injury-body-pain-gray.webp",
    flags: { [MODULE_ID]: { lacerate: true } }
  };
  if (existing) await existing.update(data);
  else await actor.createEmbeddedDocuments("ActiveEffect", [data]);
}

/** Hook: fires at the start of a lacerated creature's turn in combat. */
export async function onCombatTurnStart(combat) {
  if (!isLacerateAutomated()) return;

  const combatant = combat.combatant;
  const actor = combatant?.actor;
  if (!actor) return;

  const die = actor.getFlag(MODULE_ID, "lacerate.die");
  if (!die) return;

  const bonus = actor.getFlag(MODULE_ID, "lacerate.bonus") ?? 0;
  const formula = bonus ? `1d${die} + ${bonus}` : `1d${die}`;
  const roll = await new Roll(formula).evaluate();
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: "Laceration damage"
  });

  // Route through dnd5e's own damage application so resistance/immunity/
  // vulnerability to slashing damage is respected automatically.
  await actor.applyDamage([{ value: roll.total, type: "slashing" }]);

  const next = stepDown(die);
  if (next) await actor.setFlag(MODULE_ID, "lacerate.die", next);
  else await clearLacerate(actor);
}

async function clearLacerate(actor) {
  await actor.unsetFlag(MODULE_ID, "lacerate.die");
  const effect = actor.effects.find(e => e.getFlag(MODULE_ID, "lacerate"));
  if (effect) await effect.delete();
}
