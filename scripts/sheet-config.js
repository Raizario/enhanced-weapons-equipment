import { MODULE_ID } from "./constants.js";

/**
 * Adds a small config block to the weapon sheet, visible only when the
 * Lacerate property checkbox is ticked:
 *   - a dropdown for the starting Laceration die (d4/d6/d8/d10/d12)
 *   - a number field for a magical bonus to Lacerate's damage, for
 *     enchanted versions of a Lacerate weapon
 *
 * Values are stored as item flags so they survive independently of the
 * system's own property/damage fields:
 *   flags.enhanced-weapons-equipment.lacerateDie    (4|6|8|10|12)
 *   flags.enhanced-weapons-equipment.lacerateBonus  (number)
 */
export function registerSheetInjection() {
  Hooks.on("renderItemSheet5e", (sheet, html) => {
    const item = sheet.item;
    if (item.type !== "weapon") return;
    if (!item.system.properties?.has?.("lacerate")) return;

    const currentDie = item.getFlag(MODULE_ID, "lacerateDie") ?? 6;
    const currentBonus = item.getFlag(MODULE_ID, "lacerateBonus") ?? 0;

    const block = $(`
      <div class="form-group ewe-lacerate-config">
        <label>Lacerate Starting Die</label>
        <div class="form-fields">
          <select name="flags.${MODULE_ID}.lacerateDie">
            ${[4, 6, 8, 10, 12].map(d =>
              `<option value="${d}" ${d === currentDie ? "selected" : ""}>d${d}</option>`
            ).join("")}
          </select>
        </div>
      </div>
      <div class="form-group ewe-lacerate-config">
        <label>Lacerate Magical Bonus</label>
        <div class="form-fields">
          <input type="number" name="flags.${MODULE_ID}.lacerateBonus" value="${currentBonus}" step="1" />
        </div>
      </div>
    `);

    // Anchor near the other property checkboxes; exact selector may need
    // adjusting once tested against the live v13 weapon sheet markup.
    html.find(".tab.details .form-group").last().after(block);
  });
}
