import { MODULE_ID } from "./main.js";
import { getAllItemData } from "./compendium-data.js";

const PACK_LABEL = "Enhanced Weapons & Equipment";
const PACK_KEY = `world.${MODULE_ID}-items`;

/**
 * Runs once per world (guarded by a world setting flag) on the "ready"
 * hook. GMs only — a client without GM permission can't create
 * compendiums or world settings of type "world" scope, so this silently
 * no-ops for players.
 */
export async function buildCompendiumIfNeeded() {
  if (!game.user.isGM) return;
  if (game.settings.get(MODULE_ID, "compendiumBuilt")) return;

  ui.notifications.info("Enhanced Weapons & Equipment: building item compendium…");

  let pack = game.packs.get(PACK_KEY);
  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      type: "Item",
      label: PACK_LABEL,
      name: `${MODULE_ID}-items`,
      package: "world"
    });
  }

  const data = getAllItemData();
  await Item.createDocuments(data, { pack: pack.collection });

  await game.settings.set(MODULE_ID, "compendiumBuilt", true);
  ui.notifications.info(`Enhanced Weapons & Equipment: added ${data.length} items to "${PACK_LABEL}".`);
}

export function registerCompendiumSetting() {
  game.settings.register(MODULE_ID, "compendiumBuilt", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });
}
