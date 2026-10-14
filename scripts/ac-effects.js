import { MODULE_ID } from "./constants.js";
const busy = new Set();
const props = item => item.system?.properties instanceof Set
  ? item.system.properties : new Set(item.system?.properties ?? []);

function qualifies(item) {
  if (item.type !== "weapon" || !item.system?.equipped) return false;
  const properties = props(item);
  return properties.has("defensive") || properties.has("parry");
}

/** A single +1 AC for any equipped Defensive or Parry weapon, never one per weapon. */
export async function synchronizeAcBonus(actor) {
  if (!actor || !game.user?.isGM || busy.has(actor.uuid)) return;
  busy.add(actor.uuid);
  try {
    const enabled = game.settings.get(MODULE_ID,"automateDefensiveParryAC");
    const source = enabled ? actor.items.find(qualifies) : null;
    const ours = actor.effects.filter(e => e.getFlag(MODULE_ID,"managedDefensiveParryAC"));
    if (!source) {
      if (ours.length) await actor.deleteEmbeddedDocuments("ActiveEffect",ours.map(e=>e.id));
      return;
    }
    if (ours.length > 1) await actor.deleteEmbeddedDocuments("ActiveEffect",ours.slice(1).map(e=>e.id));
    if (ours.length) {
      const existing = ours[0];
      if (existing.getFlag(MODULE_ID,"sourceItemId") !== source.id)
        await existing.update({name:`${source.name} — Defensive/Parry (+1 AC)`,
          [`flags.${MODULE_ID}.sourceItemId`]:source.id});
      return;
    }
    await actor.createEmbeddedDocuments("ActiveEffect",[{
      name:`${source.name} — Defensive/Parry (+1 AC)`,img:source.img,
      flags:{[MODULE_ID]:{managedDefensiveParryAC:true,sourceItemId:source.id}},
      changes:[{key:"system.attributes.ac.bonus",mode:CONST.ACTIVE_EFFECT_MODES.ADD,value:"1",priority:20}]
    }]);
  } catch (error) { console.error(`${MODULE_ID} | AC automation failed`,error); }
  finally { busy.delete(actor.uuid); }
}
export function registerAcAutomation() {
  const check = (item) => {if(item?.actor && item.type === "weapon") void synchronizeAcBonus(item.actor);};
  Hooks.on("updateItem",check);
  Hooks.on("createItem",check);
  Hooks.on("deleteItem",check);
  Hooks.once("ready",() => {
    if (!game.user?.isGM) return;
    for (const actor of game.actors) void synchronizeAcBonus(actor);
  });
}
