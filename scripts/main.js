/**
 * Enhanced Weapons, Equipment & Rules
 * -------------------------------------------------
 * Stage 1: Property Framework
 *
 * This registers every property from the homebrew document as a toggleable
 * dnd5e item property (shown as a checkbox on weapon/armor sheets), and sets
 * up the hook points where "auto-math" properties (Bludgeon, Brutal, Flense,
 * Penetrate, Liquidate, Demolish, Mount, etc.) will plug in extra damage.
 *
 * Later stages (Lacerate automation, Enhanced item bonus damage,
 * Spellcasting Foci) will register their own hooks in separate files and
 * import them from here — keeping this file focused on "what properties
 * exist" rather than "what each one does."
 */

import { MODULE_ID } from "./constants.js";
import { CONDITIONS, ALWAYS_TRUE } from "./damage-properties.js";
import { applyLacerate, onCombatTurnStart } from "./lacerate.js";
import { registerSettings, playLoudSound } from "./settings.js";
import { registerSheetInjection } from "./sheet-config.js";
import { buildCompendiumIfNeeded, registerCompendiumSetting } from "./build-compendium.js";

/** Maps property key -> condition function used by the damage hook below. */
const ONHIT_CONDITIONS = {
  demolish: CONDITIONS.targetIsObjectOrStructure,
  execute: CONDITIONS.targetIncapacitated,
  mount: CONDITIONS.wielderMounted
};

const ONCRIT_CONDITIONS = {
  bludgeon: CONDITIONS.targetWearingArmor,
  brutal: ALWAYS_TRUE,
  flense: CONDITIONS.targetUnarmored,
  penetrate: CONDITIONS.targetNaturalArmor,
  liquidate: CONDITIONS.targetSubmerged
};

/**
 * Every property from the doc's Property Table (p.8), plus the special
 * combination-weapon properties. `type` marks whether the property is:
 *   - "flavor"   : text/manual only, no automation needed (Finesse, Reach...)
 *   - "onhit"    : adds bonus damage under a condition when you hit (Bludgeon...)
 *   - "oncrit"   : adds bonus damage dice specifically on a critical hit
 *   - "special"  : has its own dedicated automation module (Lacerate, Flexible...)
 *
 * `label` uses a localization key so this can be translated later; for now
 * the key just falls back to the plain English name via en.json.
 */
const WEAPON_PROPERTIES = {
  adaptable:    { type: "flavor" },
  agile:        { type: "flavor" },
  ammunition:   { type: "flavor" },
  attached:     { type: "flavor" },
  bludgeon:     { type: "oncrit", condition: "targetWearingArmor" },
  brace:        { type: "flavor" }, // reaction-based; left to manual play per user
  brawler:      { type: "flavor" },
  brutal:       { type: "oncrit" },
  bulky:        { type: "flavor" },
  bypass:       { type: "flavor" },
  combination:  { type: "special", valued: true }, // Combination (X)
  covert:       { type: "flavor" },
  cumbersome:   { type: "flavor" },
  defensive:    { type: "flavor" }, // static AC bonus; handled as an Active Effect, not a hook
  deflect:      { type: "flavor" }, // reaction-based; left to manual play per user
  demolish:     { type: "onhit", condition: "targetIsObjectOrStructure" },
  disarm:       { type: "flavor" },
  drag:         { type: "flavor" },
  execute:      { type: "onhit", condition: "targetIncapacitated" },
  finesse:      { type: "flavor" },
  flense:       { type: "oncrit", condition: "targetUnarmored" },
  flexible:     { type: "special", valued: true }, // Flexible (X)
  flourish:     { type: "flavor" },
  heavy:        { type: "flavor" },
  hidden:       { type: "flavor" },
  lacerate:     { type: "special", valued: true }, // Lacerate (X) — Stage 2
  light:        { type: "flavor" },
  liquidate:    { type: "oncrit", condition: "targetSubmerged" },
  loading:      { type: "flavor" },
  loud:         { type: "special", valued: true }, // Loud (X)
  momentum:     { type: "special", valued: true }, // Momentum (X)
  mount:        { type: "onhit", condition: "wielderMounted" },
  nimble:       { type: "flavor" },
  parry:        { type: "flavor" }, // static AC bonus; handled as an Active Effect, not a hook
  penetrate:    { type: "oncrit", condition: "targetNaturalArmor" },
  reach:        { type: "flavor" },
  reload:       { type: "special", valued: true }, // Reload (X)
  repeater:     { type: "flavor" },
  special:      { type: "flavor" }, // marks a weapon with unique rules text (see item description)
  swift:        { type: "flavor" },
  thrown:       { type: "flavor" },
  trip:         { type: "flavor" },
  twoHanded:    { type: "flavor" },
  unwieldy:     { type: "flavor" },
  versatile:    { type: "flavor" } // already native to dnd5e; not re-registered
};

/**
 * Registers non-native properties into CONFIG.DND5E.itemProperties so they
 * show up as checkboxes on weapon sheets. Skips any key dnd5e already
 * defines natively (e.g. "versatile", "finesse", "light", "reach",
 * "thrown", "twoHanded", "heavy") to avoid clobbering core behavior —
 * those keep their existing native automation and we only add the ones
 * that are new to this document.
 */
function registerWeaponProperties() {
  const native = CONFIG.DND5E.itemProperties ?? {};

  for (const [key, data] of Object.entries(WEAPON_PROPERTIES)) {
    if (native[key]) continue; // don't override a native dnd5e property

    CONFIG.DND5E.itemProperties[key] = {
      label: game.i18n.localize(`EWE.Property.${key}`),
      abbreviation: game.i18n.localize(`EWE.Property.${key}Abbr`) ?? key,
      isPhysical: true
    };

    // Make sure it's selectable for the Weapon item type specifically.
    CONFIG.DND5E.validProperties.weapon.add(key);
  }
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
  registerWeaponProperties();
  registerSettings();
  registerCompendiumSetting();
  registerSheetInjection();
});

Hooks.once("ready", () => {
  buildCompendiumIfNeeded();
});

/**
 * Central damage-hook stub. Stage 1 just wires the hook and logs; each
 * "onhit"/"oncrit" property above gets its actual math filled in here (or
 * in its own imported module) once we start Stage 3 (Enhanced Items) and
 * Stage 1b (auto-math properties). Left deliberately empty of game logic
 * for now so we can test that properties show up and round-trip correctly
 * before adding automation on top.
 */
Hooks.on("dnd5e.rollDamageV2", (rolls, data) => {
  const item = data.subject;
  const props = item?.system?.properties;
  if (!props) return;

  const target = game.user.targets.first();
  const isCrit = data.workflow?.isCritical ?? false;

  for (const roll of rolls) {
    for (const [key, fn] of Object.entries(ONHIT_CONDITIONS)) {
      if (props.has(key) && fn(item, target)) {
        roll.terms.push(...new Roll(roll.formula).terms); // duplicate one damage die
      }
    }
    if (isCrit) {
      for (const [key, fn] of Object.entries(ONCRIT_CONDITIONS)) {
        if (props.has(key) && fn(item, target)) {
          roll.terms.push(...new Roll(roll.formula).terms);
        }
      }
    }
  }

  // Lacerate: apply/escalate on a successful hit with a Lacerate weapon.
  if (props.has("lacerate") && target?.actor) {
    applyLacerate(target.actor, item);
  }

  // Loud: play the configured fire sound whenever a Loud weapon is used.
  if (props.has("loud")) playLoudSound("loudFireSound");
});

/**
 * Loud — dry-fire "click" sound. Fires when an Ammunition-property weapon
 * is used but has no ammunition left. dnd5e v13's exact "attack failed due
 * to no ammo" signal needs confirming against a live world — this listens
 * for the system's item-use hook and checks remaining ammo quantity as a
 * best-effort stand-in until that's verified.
 */
Hooks.on("dnd5e.preUseActivity", (activity, usageConfig, dialogConfig, messageConfig) => {
  const item = activity.item;
  const props = item?.system?.properties;
  if (!props?.has("loud")) return;

  const ammo = item.system.consume?.type === "ammo"
    ? item.actor?.items.get(item.system.consume.target)
    : null;

  if (ammo && ammo.system.quantity <= 0) {
    playLoudSound("loudEmptySound");
  }
});

/** Lacerate's start-of-turn auto-roll. */
Hooks.on("combatTurn", (combat) => onCombatTurnStart(combat));
Hooks.on("combatStart", (combat) => onCombatTurnStart(combat));

/**
 * Defensive / Parry — static AC bonus via Active Effect, kept in sync with
 * equip state. Guard Mastery (if the actor has that feat) upgrades +1 to +2;
 * that check is left as a TODO here since it depends on how the feat is
 * represented once the compendium is built.
 */
Hooks.on("dnd5e.equipItem", (item, equipped) => {
  const props = item.system?.properties;
  if (!props || (!props.has("defensive") && !props.has("parry"))) return;

  const actor = item.actor;
  if (!actor) return;

  const existing = actor.effects.find(e => e.getFlag(MODULE_ID, "defensiveParryBonus"));
  if (!equipped) {
    if (existing) existing.delete();
    return;
  }
  if (existing) return; // parry's "only once" stacking rule — don't duplicate

  actor.createEmbeddedDocuments("ActiveEffect", [{
    name: `${item.name} — AC Bonus`,
    icon: item.img,
    flags: { [MODULE_ID]: { defensiveParryBonus: true } },
    changes: [{
      key: "system.attributes.ac.bonus",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1"
    }]
  }]);
});

/**
 * Deflect, Combination, Flexible, and Momentum are NOT automated here.
 * Per plan, these are built as Activities baked directly into each
 * relevant item in the compendium (Stage: Compendia) rather than injected
 * generically by code — Activities are authored per-item in dnd5e v13, so
 * this is both the simpler and more reliable approach.
 */

export { WEAPON_PROPERTIES, MODULE_ID };
