import { MODULE_ID } from "./constants.js";

// Only the active GM rerolls. A per-combat round guard prevents duplicate rolls
// on simultaneous GM clients and hook re-entry. The combat flag persists across reloads.
const pending = new Set();
export function registerInitiativeReroll() {
  Hooks.on("combatRound", (combat, changed, options) => {
    if (!game.user?.isGM || !game.settings.get(MODULE_ID,"rerollInitiativeEachRound")) return;
    if (game.users.activeGM?.id !== game.user.id) return;
    const round = Number(combat.round ?? changed?.round);
    if (!Number.isInteger(round) || round < 2 || pending.has(combat.uuid)) return;
    if (combat.getFlag(MODULE_ID,"lastInitiativeRerollRound") === round) return;
    pending.add(combat.uuid);
    void (async () => {
      try {
        // Reserve this round before rolling, so no second handler can repeat it.
        await combat.setFlag(MODULE_ID,"lastInitiativeRerollRound",round);
        const ids = combat.combatants.filter(c => !c.defeated && c.actor).map(c=>c.id);
        if (!ids.length) return;
        await combat.rollInitiative(ids,{ updateTurn:false });
        ui.notifications.info(`Enhanced Weapons: initiative rerolled for round ${round}.`);
      } catch (error) {
        console.error(`${MODULE_ID} | Initiative reroll failed`,error);
        ui.notifications.error("Enhanced Weapons: initiative reroll failed; check the console.");
      } finally { pending.delete(combat.uuid); }
    })();
  });
}
