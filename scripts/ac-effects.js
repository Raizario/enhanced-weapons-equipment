import { MODULE_ID } from "./constants.js";
const busy = new Set();
const propertiesOf = item => item.system?.properties instanceof Set
  ? item.system.properties : new Set(item.system?.properties ?? []);
const qualify = item => item.type === "weapon" && Boolean(item.system?.equipped);
const effectKey = (itemId, property) => `${itemId}:${property}`;

/** Each equipped weapon independently grants +1 for Defensive and +1 for Parry.
 * These two bonuses stack with each other and with other qualifying weapons.
 * Conditional wielding requirements are the player's responsibility.
 */
export async function synchronizeAcBonus(actor) {
  if (!actor || !game.user?.isGM || game.users.activeGM?.id !== game.user.id || busy.has(actor.uuid)) return;
  busy.add(actor.uuid);
  try {
    const enabled = game.settings.get(MODULE_ID, "automateDefensiveParryAC");
    const wanted = new Map();
    if (enabled) for (const item of actor.items) {
      if (!qualify(item)) continue;
      const props = propertiesOf(item);
      for (const property of ["defensive", "parry"]) {
        if (props.has(property)) wanted.set(effectKey(item.id, property), { item, property });
      }
    }
    // Also remove legacy 0.1.8 combined effect (it prevented stacking).
    const managed = actor.effects.filter(e =>
      e.getFlag(MODULE_ID, "managedDefensiveParryAC") || e.getFlag(MODULE_ID, "managedAcProperty"));
    const seen = new Set();
    const remove = [];
    for (const effect of managed) {
      const key = effect.getFlag(MODULE_ID, "acEffectKey");
      if (!key || !wanted.has(key) || seen.has(key)) remove.push(effect.id);
      else seen.add(key);
    }
    if (remove.length) await actor.deleteEmbeddedDocuments("ActiveEffect", remove);
    const create = [];
    for (const [key, {item, property}] of wanted) {
      if (seen.has(key)) continue;
      create.push({
        name: `${item.name} — ${property === "defensive" ? "Defensive" : "Parry"} (+1 AC)`,
        img: item.img,
        flags: { [MODULE_ID]: { managedAcProperty: true, acEffectKey: key, sourceItemId: item.id, property } },
        changes: [{ key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1", priority: 20 }]
      });
    }
    if (create.length) await actor.createEmbeddedDocuments("ActiveEffect", create);
  } catch (error) { console.error(`${MODULE_ID} | AC automation failed`, error); }
  finally { busy.delete(actor.uuid); }
}
export function registerAcAutomation() {
  const check = item => { if (item?.actor && item.type === "weapon") void synchronizeAcBonus(item.actor); };
  Hooks.on("updateItem", check);
  Hooks.on("createItem", check);
  Hooks.on("deleteItem", check);
  Hooks.once("ready", () => {
    if (!game.user?.isGM) return;
    for (const actor of game.actors) void synchronizeAcBonus(actor);
  });
}
