/**
 * Auto-math for properties that add an extra weapon damage die under a
 * condition. Each condition checker takes (attacker, target, item) and
 * returns true/false; the caller in main.js adds one extra damage die of
 * the weapon's damage type when true.
 */

export const CONDITIONS = {
  targetWearingArmor(attacker, target) {
    const armor = target.actor?.armor; // dnd5e equipped armor item, if any
    return !!armor && armor.system.type?.value !== "natural";
  },

  targetUnarmored(attacker, target) {
    return !this.targetWearingArmor(attacker, target);
  },

  targetNaturalArmor(attacker, target) {
    const armor = target.actor?.armor;
    return armor?.system.type?.value === "natural";
  },

  targetSubmerged(attacker, target) {
    // No native dnd5e "submerged" state — reads a manually-toggled status
    // effect until/unless the table has a better way to flag this.
    return !!target.actor?.statuses?.has("submerged");
  },

  targetIsObjectOrStructure(attacker, target) {
    return target.actor?.type === "vehicle" || target.document?.type === "wall";
  },

  targetIncapacitated(attacker, target) {
    const s = target.actor?.statuses;
    return ["incapacitated", "paralyzed", "restrained", "surprised", "unconscious"]
      .some(st => s?.has(st));
  },

  wielderMounted(attacker) {
    return !!attacker.actor?.statuses?.has("mounted");
  }
};

/** True for the always-on-crit properties: Brutal doesn't need a condition. */
export const ALWAYS_TRUE = () => true;
