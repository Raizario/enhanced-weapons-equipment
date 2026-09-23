import { MODULE_ID } from "./constants.js";

/**
 * Adds a standalone "Enhanced Weapons & Equipment" config section to the
 * weapon sheet, with fields for whichever of this module's X-valued
 * properties are currently checked. Rendered as its own bordered section
 * at the end of the Details tab, deliberately NOT nested inside any of
 * the system's own fieldsets (a v0.1.2 bug had this landing inside the
 * native Limited Uses block by accident).
 *
 * Stored as item flags, one per property:
 *   flags.enhanced-weapons-equipment.lacerateDie      (4|6|8|10|12)
 *   flags.enhanced-weapons-equipment.lacerateBonus    (number)
 *   flags.enhanced-weapons-equipment.flexibleDamage   (string, e.g. "1d6")
 *   flags.enhanced-weapons-equipment.momentumDamage   (string, e.g. "3d6")
 *   flags.enhanced-weapons-equipment.loudFeet         (number)
 *   flags.enhanced-weapons-equipment.combinationSpeed ("Fast"|"Standard"|"Slow")
 */
export function registerSheetInjection() {
  Hooks.on("renderItemSheet5e", (sheet, html) => {
    const item = sheet.item;
    if (item.type !== "weapon") return;

    const props = item.system.properties;
    if (!props) return;

    const rows = [];

    if (props.has("lacerate")) {
      const die = item.getFlag(MODULE_ID, "lacerateDie") ?? 6;
      const bonus = item.getFlag(MODULE_ID, "lacerateBonus") ?? 0;
      rows.push(`
        <div class="form-group">
          <label>Lacerate Starting Die</label>
          <div class="form-fields">
            <select name="flags.${MODULE_ID}.lacerateDie">
              ${[4, 6, 8, 10, 12].map(d =>
                `<option value="${d}" ${d === die ? "selected" : ""}>d${d}</option>`
              ).join("")}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Lacerate Magical Bonus</label>
          <div class="form-fields">
            <input type="number" name="flags.${MODULE_ID}.lacerateBonus" value="${bonus}" step="1" />
          </div>
          <p class="hint">Flat bonus added to the automatic bleed damage each turn — e.g. enter 1 for a +1 Lacerate weapon.</p>
        </div>
      `);
    }

    if (props.has("flexible")) {
      const val = item.getFlag(MODULE_ID, "flexibleDamage") ?? "";
      rows.push(`
        <div class="form-group">
          <label>Flexible Damage (X)</label>
          <div class="form-fields">
            <input type="text" name="flags.${MODULE_ID}.flexibleDamage" value="${val}" placeholder="e.g. 1d6" />
          </div>
        </div>
      `);
    }

    if (props.has("momentum")) {
      const val = item.getFlag(MODULE_ID, "momentumDamage") ?? "";
      rows.push(`
        <div class="form-group">
          <label>Momentum Damage (X)</label>
          <div class="form-fields">
            <input type="text" name="flags.${MODULE_ID}.momentumDamage" value="${val}" placeholder="e.g. 3d6" />
          </div>
        </div>
      `);
    }

    if (props.has("loud")) {
      const val = item.getFlag(MODULE_ID, "loudFeet") ?? 500;
      rows.push(`
        <div class="form-group">
          <label>Loud Radius (feet)</label>
          <div class="form-fields">
            <input type="number" name="flags.${MODULE_ID}.loudFeet" value="${val}" step="1" />
          </div>
        </div>
      `);
    }

    if (props.has("combination")) {
      const val = item.getFlag(MODULE_ID, "combinationSpeed") ?? "Standard";
      rows.push(`
        <div class="form-group">
          <label>Combination Speed</label>
          <div class="form-fields">
            <select name="flags.${MODULE_ID}.combinationSpeed">
              ${["Fast", "Standard", "Slow"].map(s =>
                `<option value="${s}" ${s === val ? "selected" : ""}>${s}</option>`
              ).join("")}
            </select>
          </div>
        </div>
      `);
    }

    if (!rows.length) return; // nothing checked that needs a value field

    const section = $(`
      <fieldset class="ewe-config">
        <legend>Enhanced Weapons & Equipment</legend>
        ${rows.join("")}
      </fieldset>
    `);

    // Prefer the Details tab specifically; fall back progressively if the
    // sheet markup differs from what's expected here.
    const anchor =
      html.find('.tab[data-tab="details"]').length ? html.find('.tab[data-tab="details"]') :
      html.find('.sheet-body').length ? html.find('.sheet-body') :
      html;

    anchor.append(section);
  });
}
