import { MODULE_ID } from "./constants.js";

// Stored on each Combat document, not in browser state, so a reload or a
// different active GM doesn't lose the initiatives from earlier rounds.
const processing = new Set();
const FLAG = "initiativeRoundHistory";
const snapshot = combat => Object.fromEntries(combat.combatants.map(c => [c.id, c.initiative ?? null]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function applySnapshot(combat, values) {
  const changes = combat.combatants
    .filter(c => Object.prototype.hasOwnProperty.call(values, c.id) && c.initiative !== values[c.id])
    .map(c => ({ _id: c.id, initiative: values[c.id] }));
  if (changes.length) await combat.updateEmbeddedDocuments("Combatant", changes);
}

async function handleRound(combat) {
  if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id) return;
  if (!game.settings.get(MODULE_ID, "rerollInitiativeEachRound")) return;
  if (!combat?.started || processing.has(combat.uuid)) return;
  const round = Number(combat.round);
  if (!Number.isInteger(round) || round < 1) return;
  processing.add(combat.uuid);
  try {
    const stored = foundry.utils.deepClone(combat.getFlag(MODULE_ID, FLAG) ?? {});
    const roundKey = String(round);
    // On a return to a known round, NEVER roll again.
    if (stored[roundKey]) {
      await applySnapshot(combat, stored[roundKey]);
      return;
    }
    // Round one gets fresh initiatives as soon as combat starts. Subsequent
    // first visits also roll, including if the GM skips forward several rounds.
    const ids = combat.combatants.filter(c => !c.defeated && c.actor).map(c => c.id);
    if (ids.length) await combat.rollInitiative(ids, { updateTurn: false });
    stored[roundKey] = snapshot(combat);
    await combat.setFlag(MODULE_ID, FLAG, stored);
    ui.notifications.info(`Enhanced Weapons: initiative rolled for round ${round}.`);
  } catch (error) {
    console.error(`${MODULE_ID} | Initiative history failed`, error);
    ui.notifications.error("Enhanced Weapons: initiative history failed; check console.");
  } finally {
    processing.delete(combat.uuid);
  }
}

export function registerInitiativeReroll() {
  // combatStart fires when the Begin Combat button is pressed; combatRound
  // fires after both next-round and previous-round navigation.
  Hooks.on("combatStart", combat => { void handleRound(combat); });
  Hooks.on("combatRound", combat => { void handleRound(combat); });
  // Also detect round changes through the document update path for modules
  // that advance rounds without using the tracker controls.
  Hooks.on("updateCombat", (combat, changed) => {
    if (Object.prototype.hasOwnProperty.call(changed, "round")) void handleRound(combat);
  });
}
