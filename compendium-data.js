import { MODULE_ID } from "./constants.js";

/**
 * Row format: [name, "cost", "dmgDice", "dmgType", weightLb, "prop,prop:val,..."]
 * A property token with ":value" (e.g. "versatile:1d10", "lacerate:d6",
 * "thrown:20/60", "reload:2", "loud:500") is expanded into:
 *   - flags.enhanced-weapons-equipment.propValues.<key> = "value"
 *   - for "versatile" specifically, also system.damage.versatile (native dnd5e field)
 *   - for "thrown"/"ammunition" specifically, also system.range {value, long}
 * Damage "—" (net, unarmed variants without a die) is handled as flat 1 or none.
 */

const SIMPLE_MELEE = [
  ["Arming Sword", "1 gp", "1d6", "slashing", 3, "flexible:1d4,light"],
  ["Boar Spear", "2 gp", "1d6", "piercing", 5, "brace,twoHanded"],
  ["Brass Knuckles", "5 gp", "1d4", "bludgeoning", 1, "attached,light,nimble"],
  ["Claw", "5 gp", "1d6", "slashing", 2, "attached,light"],
  ["Club", "1 sp", "1d4", "bludgeoning", 2, "brawler,light,versatile:1d6"],
  ["Dagger", "2 gp", "1d4", "piercing", 1, "execute,finesse,light,thrown:20/60"],
  ["Greatclub", "2 sp", "2d4", "bludgeoning", 10, "brawler,heavy,twoHanded"],
  ["Handaxe", "5 gp", "1d6", "slashing", 2, "light,nimble,thrown:20/60"],
  ["Hidden Knife", "25 gp", "1d4", "piercing", 1, "attached,execute,finesse,hidden,light"],
  ["Javelin", "5 sp", "1d6", "piercing", 2, "thrown:30/120,versatile:1d8"],
  ["Light Hammer", "2 gp", "1d4", "bludgeoning", 2, "bludgeon,light,thrown:20/60"],
  ["Mace", "5 gp", "1d6", "bludgeoning", 4, "demolish,versatile:1d8"],
  ["Quarterstaff", "2 sp", "1d6", "bludgeoning", 4, "agile,versatile:1d8"],
  ["Scythe", "5 gp", "2d4", "slashing", 5, "heavy,reach,twoHanded"],
  ["Sickle", "1 gp", "1d4", "slashing", 2, "finesse,lacerate:d4,light"],
  ["Shortspear", "1 gp", "1d6", "piercing", 3, "finesse,thrown:20/60,versatile:1d8"],
  ["Unarmed Strike", "0 gp", "1", "bludgeoning", 0, "light,nimble"]
];

const SIMPLE_RANGED = [
  ["Dart", "5 cp", "1d4", "piercing", 0.25, "covert,finesse,thrown:20/60"],
  ["Light Crossbow", "25 gp", "1d8", "piercing", 5, "ammunition:80/320,loading,twoHanded"],
  ["Shortbow", "25 gp", "1d6", "piercing", 2, "ammunition:80/320,twoHanded"],
  ["Sling", "1 sp", "1d4", "bludgeoning", 0, "ammunition:30/120"],
  ["Slingshot", "2 sp", "1d6", "bludgeoning", 0.25, "ammunition:20/60,twoHanded"],
  ["Throwing Knife", "5 gp", "1d6", "piercing", 1, "finesse,thrown:20/60"],
  ["Throwing Star", "5 sp", "1d4", "slashing", 0.5, "finesse,thrown:30/120"]
];

const MARTIAL_MELEE = [
  ["Bastard Sword", "30 gp", "1d10", "slashing", 6, "heavy,versatile:1d12"],
  ["Battleaxe", "10 gp", "1d8", "slashing", 4, "flense,versatile:1d10"],
  ["Broadsword", "30 gp", "2d4", "slashing", 4, "defensive,flexible:1d4"],
  ["Chain Club", "5 gp", "1d6", "bludgeoning", 4, "bludgeon,finesse,flexible:1d6,twoHanded"],
  ["Chain Hook", "15 gp", "1d8", "piercing", 3, "disarm,drag,reach,twoHanded"],
  ["Chain Sickle", "5 gp", "1d6", "slashing", 4, "flourish,flexible:1d6,reach,twoHanded"],
  ["Clawed Gauntlet", "5 gp", "1d6", "slashing", 2, "attached,finesse,lacerate:d4,light"],
  ["Cutlass", "25 gp", "1d8", "slashing", 2, "finesse,swift"],
  ["Double-Bladed Scimitar", "100 gp", "2d4", "slashing", 6, "deflect,finesse,flexible:1d4,twoHanded"],
  ["Double-Headed Axe", "100 gp", "1d6", "slashing", 10, "flense,flexible:1d6,heavy,twoHanded"],
  ["Double-Headed Hammer", "100 gp", "1d6", "bludgeoning", 10, "bludgeon,flexible:1d6,heavy,twoHanded"],
  ["Double-Headed Spear", "100 gp", "1d6", "piercing", 6, "finesse,flexible:1d6,reach,twoHanded"],
  ["Estoc", "25 gp", "1d8", "piercing", 2, "finesse,penetrate"],
  ["Flail", "10 gp", "1d8", "bludgeoning", 2, "bypass,versatile:1d10"],
  ["Glaive", "20 gp", "1d10", "slashing", 6, "finesse,heavy,reach,twoHanded"],
  ["Greataxe", "30 gp", "1d12", "slashing", 7, "heavy,momentum:2d12,twoHanded"],
  ["Greatscythe", "40 gp", "3d4", "slashing", 10, "execute,heavy,reach,twoHanded"],
  ["Greatsword", "50 gp", "2d6", "slashing", 6, "heavy,momentum:3d6,twoHanded"],
  ["Halberd", "20 gp", "2d6", "slashing", 6, "heavy,reach,trip,twoHanded"],
  ["Harpoon", "1 gp", "1d6", "piercing", 3, "liquidate,special,thrown:15/30"],
  ["Hidden Blade", "25 gp", "1d6", "piercing", 2, "execute,finesse,hidden,light"],
  ["Katana", "25 gp", "1d8", "slashing", 3, "deflect,finesse,versatile:1d10"],
  ["Khopesh", "25 gp", "1d6", "slashing", 3, "disarm,finesse,light"],
  ["Lance", "20 gp", "1d8", "piercing", 6, "mount,reach"],
  ["Longspear", "25 gp", "1d8", "piercing", 9, "heavy,reach,thrown:20/60,versatile:1d10"],
  ["Longsword", "15 gp", "1d8", "slashing", 3, "flexible:1d4,versatile:1d10"],
  ["Maul", "10 gp", "1d12", "bludgeoning", 10, "bludgeon,heavy,momentum:2d12,twoHanded"],
  ["Morningstar", "15 gp", "1d8", "piercing", 4, "penetrate,versatile:1d10"],
  ["Nunchaku", "10 gp", "1d6", "bludgeoning", 2, "finesse,flourish,versatile:1d8"],
  ["Parrying Dagger", "15 gp", "1d4", "piercing", 1, "disarm,finesse,light,parry"],
  ["Partisan", "25 gp", "1d8", "piercing", 7, "brace,reach,versatile:1d10"],
  ["Pike", "5 gp", "1d10", "piercing", 18, "brace,heavy,reach,twoHanded"],
  ["Polehammer", "5 gp", "2d6", "bludgeoning", 18, "bludgeon,heavy,reach,twoHanded"],
  ["Rapier", "25 gp", "1d8", "piercing", 2, "defensive,finesse"],
  ["Riding Hammer", "20 gp", "1d8", "bludgeoning", 5, "mount,versatile:1d10"],
  ["Saber", "50 gp", "1d8", "slashing", 4, "finesse,mount"],
  ["Scimitar", "25 gp", "1d6", "slashing", 3, "finesse,light,nimble"],
  ["Shortsword", "10 gp", "1d6", "piercing", 2, "adaptable,finesse,light"],
  ["Spiked Gauntlet", "5 gp", "1d6", "piercing", 1, "attached,finesse,light,penetrate"],
  ["Splitstaff", "25 gp", "1d8", "bludgeoning", 8, "agile,heavy,reach,versatile:1d10"],
  ["Trident", "5 gp", "1d8", "piercing", 4, "liquidate,thrown:20/60,versatile:1d10"],
  ["Twinblade", "50 gp", "2d4", "slashing", 5, "finesse,flourish,twoHanded"],
  ["War Pick", "5 gp", "1d8", "piercing", 2, "demolish,penetrate"],
  ["War Saw", "30 gp", "1d8", "slashing", 6, "lacerate:d6,swift,versatile:1d10"],
  ["Warclub", "15 gp", "3d4", "bludgeoning", 15, "brutal,heavy,twoHanded"],
  ["Warhammer", "15 gp", "1d8", "bludgeoning", 2, "bludgeon,versatile:1d10"],
  ["Weighted Gauntlet", "5 gp", "1d6", "bludgeoning", 2, "attached,bludgeon,finesse,light"],
  ["Whip", "2 gp", "1d4", "piercing", 3, "disarm,finesse,light,reach"]
];

const MARTIAL_RANGED = [
  ["Blowgun", "10 gp", "1", "piercing", 1, "ammunition:25/100,covert,loading"],
  ["Composite Bow", "50 gp", "1d8", "piercing", 2, "ammunition:100/400,finesse,heavy,twoHanded"],
  ["Hand Crossbow", "75 gp", "1d6", "piercing", 3, "ammunition:30/120,light,loading"],
  ["Heavy Crossbow", "50 gp", "1d10", "piercing", 18, "ammunition:100/400,heavy,loading,twoHanded"],
  ["Repeater Crossbow", "150 gp", "1d6", "piercing", 7, "ammunition:50/200,repeater,twoHanded"],
  ["Greatbow", "65 gp", "1d10", "piercing", 5, "ammunition:200/800,bulky,cumbersome,heavy,twoHanded"],
  ["Longbow", "50 gp", "1d8", "piercing", 2, "ammunition:150/600,heavy,twoHanded"],
  ["Net", "25 gp", "0", "bludgeoning", 25, "special,thrown:5/20"],
  ["Wristbow", "100 gp", "1d4", "piercing", 3, "ammunition:30/120,attached,hidden,light,loading"]
];

const ADVANCED_MELEE = [
  ["Ōdachi", "400 gp", "2d8", "slashing", 12, "flense,heavy,momentum:3d8,twoHanded"],
  ["Quadflail", "500 gp", "1d4", "bludgeoning", 8, "bypass,heavy,special,unwieldy"],
  ["Ranseur", "500 gp", "3d6", "piercing", 20, "brutal,drag,heavy,reach,twoHanded"],
  ["Serrated War Wheel", "500 gp", "3d4", "slashing", 18, "heavy,lacerate:d10,momentum:5d4,special,twoHanded,unwieldy"],
  ["Serrated Whip", "350 gp", "1d6", "slashing", 5, "finesse,flexible:1d6,lacerate:d6,reach"],
  ["Siege Maul", "500 gp", "2d10", "bludgeoning", 25, "brutal,demolish,heavy,twoHanded,unwieldy"],
  ["Ultragreatsword", "500 gp", "3d8", "slashing", 50, "brutal,heavy,momentum:4d8,twoHanded,unwieldy"],
  ["Urumi", "350 gp", "2d6", "slashing", 5, "finesse,flexible:1d6,reach,unwieldy"],
  ["Warscythe", "500 gp", "4d4", "slashing", 15, "brutal,finesse,heavy,reach,twoHanded"],
  ["Zweihänder", "450 gp", "3d6", "slashing", 10, "defensive,heavy,reach,twoHanded"]
];

const FIREARMS = [
  ["Blunderbuss", "150 gp", "3d4", "piercing", 5, "ammunition:20/60,loud:1000,reload:1,twoHanded"],
  ["Musket", "100 gp", "1d10", "piercing", 10, "ammunition:80/240,loud:1000,reload:1,twoHanded"],
  ["Pistol", "200 gp", "1d8", "piercing", 2, "ammunition:40/120,loud:500,reload:2"],
  ["Revolver", "750 gp", "1d10", "piercing", 2, "ammunition:60/240,loud:500,reload:6"],
  ["Repeater Blunderbuss", "375 gp", "2d4", "piercing", 6, "ammunition:10/30,loud:1000,reload:2,repeater,twoHanded"],
  ["Repeater Pistol", "375 gp", "1d6", "piercing", 3, "ammunition:30/90,loud:500,reload:3,repeater"],
  ["Repeater Musket", "250 gp", "1d8", "piercing", 11, "ammunition:60/180,loud:1000,reload:2,repeater,twoHanded"],
  ["Rifle", "1000 gp", "1d12", "piercing", 8, "ammunition:120/480,loud:500,reload:6,twoHanded"]
];

const TOMMYBOWS = [
  ["Hand Tommybow", "150 gp", "1d6", "piercing", 4, "ammunition:30/60,light,reload:2"],
  ["Light Tommybow", "50 gp", "1d8", "piercing", 7, "ammunition:80/160,reload:2,twoHanded"],
  ["Heavy Tommybow", "100 gp", "1d10", "piercing", 23, "ammunition:100/200,heavy,reload:2,twoHanded"]
];

/**
 * Advanced Combination Weapons have two full profiles. Rather than force
 * them through the single-damage-line parser above, each entry here stores
 * both profiles' text directly; the item is created with the Primary
 * profile as its baseline attack (system.damage/properties) and the full
 * Primary/Secondary text preserved in the description AND in
 * flags.enhanced-weapons-equipment.combination = { speed, primary, secondary }
 * for the Activities that will be hand-built onto these in the compendium
 * later (per plan — Combination/Flexible/Momentum/Deflect are Activities,
 * not automated properties).
 */
const COMBINATION_WEAPONS = [
  {
    name: "Cannon Lance", cost: "800 gp", weight: 15, speed: "Fast",
    primary: { label: "Lance", damage: "1d12", type: "piercing", props: "heavy,reach,special,twoHanded,unwieldy" },
    secondary: { label: "Cannon", damage: "4d4", type: "piercing", props: "ammunition:30/90,loud:1000,reload:2,special,twoHanded,unwieldy" }
  },
  {
    name: "Great Gunblade", cost: "750 gp", weight: 12, speed: "Fast",
    primary: { label: "Blade", damage: "2d6", type: "slashing", props: "heavy,twoHanded" },
    secondary: { label: "Gun", damage: "1d6", type: "piercing", props: "ammunition:60/180,loud:500,reload:3,twoHanded" }
  },
  {
    name: "Gun Axe", cost: "650 gp", weight: 8, speed: "Fast",
    primary: { label: "Axe", damage: "1d10", type: "slashing", props: "heavy,lacerate:d6,twoHanded" },
    secondary: { label: "Gun", damage: "1d8", type: "piercing", props: "ammunition:40/120,loud:500,reload:2,twoHanded" }
  },
  {
    name: "Gun Spear", cost: "600 gp", weight: 8, speed: "Fast",
    primary: { label: "Spear", damage: "1d8", type: "piercing", props: "reach,twoHanded" },
    secondary: { label: "Gun", damage: "1d12", type: "piercing", props: "ammunition:80/240,loud:1000,reload:1,twoHanded" }
  },
  {
    name: "Gunblade", cost: "500 gp", weight: 6, speed: "Fast",
    primary: { label: "Blade", damage: "1d8", type: "slashing", props: "versatile:1d10" },
    secondary: { label: "Gun", damage: "1d6", type: "piercing", props: "ammunition:40/120,loud:500,reload:2" }
  },
  {
    name: "Rifle Scythe", cost: "700 gp", weight: 10, speed: "Fast",
    primary: { label: "Scythe", damage: "2d6", type: "slashing", props: "heavy,reach,twoHanded" },
    secondary: { label: "Musket", damage: "1d10", type: "piercing", props: "ammunition:80/240,loud:1000,reload:1,twoHanded" }
  },
  {
    name: "Rocket Hammer", cost: "650 gp", weight: 12, speed: "Fast",
    primary: { label: "Hammer", damage: "1d12", type: "bludgeoning", props: "heavy,special,twoHanded" },
    secondary: { label: "Blast", damage: "3d4", type: "piercing", props: "ammunition:20/60,loud:1000,reload:1,special,twoHanded" }
  },
  {
    name: "Short Gunblade", cost: "350 gp", weight: 4, speed: "Fast",
    primary: { label: "Blade", damage: "1d6", type: "slashing", props: "finesse,light" },
    secondary: { label: "Gun", damage: "1d6", type: "piercing", props: "ammunition:20/60,loud:500,reload:1" }
  },
  {
    name: "Axe-Hook", cost: "500 gp", weight: 8, speed: "Standard",
    primary: { label: "Axe", damage: "1d10", type: "slashing", props: "heavy,twoHanded" },
    secondary: { label: "Extended Hook", damage: "1d8", type: "slashing", props: "drag,reach,twoHanded" }
  },
  {
    name: "Church Pick", cost: "550 gp", weight: 6, speed: "Standard",
    primary: { label: "Sword", damage: "1d8", type: "slashing", props: "disarm,lacerate:d4,versatile:1d10" },
    secondary: { label: "Extended Pick", damage: "1d10", type: "piercing", props: "penetrate,reach,versatile:1d12" }
  },
  {
    name: "Cane Whip", cost: "300 gp", weight: 3, speed: "Standard",
    primary: { label: "Cane Blade", damage: "1d6", type: "slashing", props: "execute,finesse,hidden,swift" },
    secondary: { label: "Whip", damage: "1d6", type: "slashing", props: "finesse,hidden,lacerate:d4,reach" }
  },
  {
    name: "Saw Cleaver", cost: "600 gp", weight: 9, speed: "Standard",
    primary: { label: "Cleaver", damage: "1d8", type: "slashing", props: "swift,versatile:1d10" },
    secondary: { label: "Extended Cleaver", damage: "2d6", type: "slashing", props: "reach,unwieldy,versatile:2d8" }
  },
  {
    name: "Segmented Cleaver", cost: "650 gp", weight: 14, speed: "Standard",
    primary: { label: "Heavy Cleaver", damage: "2d6", type: "slashing", props: "heavy,momentum:3d6,twoHanded" },
    secondary: { label: "Segmented Blade", damage: "2d8", type: "slashing", props: "drag,reach,twoHanded,unwieldy" }
  },
  {
    name: "Swordstaff", cost: "450 gp", weight: 6, speed: "Standard",
    primary: { label: "Sword", damage: "1d8", type: "slashing", props: "deflect,finesse" },
    secondary: { label: "Staff-Spear", damage: "1d10", type: "piercing", props: "agile,reach,twoHanded" }
  },
  {
    name: "Switch Axe", cost: "800 gp", weight: 16, speed: "Standard",
    primary: { label: "Axe", damage: "1d12", type: "slashing", props: "heavy,penetrate,twoHanded" },
    secondary: { label: "Sword", damage: "2d6", type: "slashing", props: "defensive,heavy,twoHanded" }
  },
  {
    name: "Twinblade Splitter", cost: "500 gp", weight: 6, speed: "Standard",
    primary: { label: "Twinblade", damage: "2d4", type: "slashing", props: "finesse,flourish,twoHanded" },
    secondary: { label: "Split Blades", damage: "1d6", type: "slashing", props: "finesse,light,special,swift" }
  },
  {
    name: "Twinbow", cost: "450 gp", weight: 6, speed: "Standard",
    primary: { label: "Twinblade", damage: "2d4", type: "slashing", props: "finesse,flourish,twoHanded" },
    secondary: { label: "Bow", damage: "1d6", type: "piercing", props: "ammunition:80/320,twoHanded" }
  },
  {
    name: "Whipblade", cost: "450 gp", weight: 5, speed: "Standard",
    primary: { label: "Blade", damage: "2d4", type: "slashing", props: "finesse,swift" },
    secondary: { label: "Whip", damage: "2d4", type: "slashing", props: "drag,finesse,reach" }
  },
  {
    name: "Charge Axe", cost: "900 gp", weight: 18, speed: "Slow",
    primary: { label: "Sword & Shield", damage: "1d8", type: "slashing", props: "defensive,versatile:1d10" },
    secondary: { label: "Great Axe", damage: "2d10", type: "slashing", props: "heavy,lacerate:d6,twoHanded,unwieldy" }
  },
  {
    name: "Hammerblade", cost: "850 gp", weight: 22, speed: "Slow",
    primary: { label: "Sword", damage: "1d8", type: "slashing", props: "flexible:1d4" },
    secondary: { label: "Hammer", damage: "2d12", type: "bludgeoning", props: "demolish,heavy,twoHanded,unwieldy" }
  },
  {
    name: "Sheathed Greatblade", cost: "800 gp", weight: 16, speed: "Slow",
    primary: { label: "Sword", damage: "1d8", type: "slashing", props: "defensive" },
    secondary: { label: "Greatblade", damage: "3d6", type: "slashing", props: "bludgeon,heavy,reach,twoHanded" }
  },
  {
    name: "Shield Blade", cost: "900 gp", weight: 20, speed: "Slow",
    primary: { label: "Greatblade", damage: "2d6", type: "slashing", props: "heavy,special,twoHanded" },
    secondary: { label: "Tower Shield", damage: "0", type: "bludgeoning", props: "special,twoHanded", acBonus: 3 }
  }
];

const ARMOR = [
  // [name, tier(light/medium/heavy), "cost", baseAC, dexCap(null=unlimited, number=cap, 0=none), strReq, stealthDisadv(bool), weight, damageOnHit ("1d6 piercing" etc, or null)]
  ["Padded", "light", "5 gp", 11, null, 0, true, 8, null],
  ["Leather", "light", "10 gp", 11, null, 0, false, 10, null],
  ["Studded Leather", "light", "45 gp", 12, null, 0, false, 13, null],
  ["Brigandine", "light", "1500 gp", 13, null, 0, false, 15, null],
  ["Light Spiked", "light", "2000 gp", 14, null, 11, false, 18, "1d6 piercing"],
  ["Light Carapace", "light", "10000 gp", 15, null, 11, false, 20, null],
  ["Hide", "medium", "10 gp", 12, 2, 0, false, 12, null],
  ["Chain Shirt", "medium", "50 gp", 13, 2, 0, false, 20, null],
  ["Scale Mail", "medium", "50 gp", 14, 2, 0, true, 45, null],
  ["Breastplate", "medium", "400 gp", 14, 2, 0, false, 20, null],
  ["Half Plate", "medium", "750 gp", 15, 2, 0, true, 40, null],
  ["Laminar Plate", "medium", "1500 gp", 15, 2, 0, false, 35, null],
  ["Medium Spiked", "medium", "4000 gp", 16, 2, 13, true, 45, "1d8 piercing"],
  ["Medium Carapace", "medium", "15000 gp", 17, 2, 13, true, 50, null],
  ["Ring Mail", "heavy", "30 gp", 14, 0, 0, true, 40, null],
  ["Chain Mail", "heavy", "50 gp", 16, 0, 13, true, 55, null],
  ["Splint", "heavy", "200 gp", 17, 0, 15, true, 60, null],
  ["Plate", "heavy", "1500 gp", 18, 0, 15, true, 65, null],
  ["Lamellan Plate", "heavy", "2000 gp", 18, 0, 15, false, 60, null],
  ["Heavy Spiked", "heavy", "6000 gp", 19, 0, 17, true, 70, "1d10 piercing"],
  ["Heavy Carapace", "heavy", "20000 gp", 20, 0, 17, true, 75, null]
];

const SHIELDS = [
  // [name, "cost", acBonus, strReq, damage, damageType, props, weight]
  ["Buckler", "5 gp", 1, 0, "1d4", "bludgeoning", "deflect", 2],
  ["Round Shield", "10 gp", 2, 0, "1d6", "bludgeoning", "", 6],
  ["Tower Shield", "1500 gp", 3, 17, "1d8", "bludgeoning", "heavy", 45]
];

function parseCost(str) {
  const [value, denom] = str.split(" ");
  return { value: Number(value), denomination: denom || "gp" };
}

function parseProps(str) {
  const properties = new Set();
  const propValues = {};
  if (!str) return { properties, propValues };
  for (const token of str.split(",")) {
    const [key, val] = token.split(":");
    properties.add(key);
    if (val !== undefined) propValues[key] = val;
  }
  return { properties, propValues };
}

function buildWeaponItem([name, cost, dmg, type, weight, propStr], weaponType) {
  const { properties, propValues } = parseProps(propStr);

  const system = {
    type: { value: weaponType, baseItem: "" },
    price: parseCost(cost),
    weight: { value: weight, units: "lb" },
    damage: { base: { number: 1, denomination: dmg.replace(/^\d*d/, "") || null, types: [type] } },
    properties: Array.from(properties)
  };

  if (propValues.versatile) {
    system.damage.versatile = { number: 1, denomination: propValues.versatile.replace(/^\d*d/, ""), types: [type] };
  }
  if (propValues.thrown || propValues.ammunition) {
    const [near, far] = (propValues.thrown || propValues.ammunition).split("/").map(Number);
    system.range = { value: near, long: far, units: "ft" };
  }

  return {
    name,
    type: "weapon",
    img: "icons/svg/sword.svg",
    system,
    flags: { [MODULE_ID]: { propValues } }
  };
}

function buildCombinationItem(entry) {
  const p = entry.primary;
  const { properties: pProps, propValues: pVals } = parseProps(p.props);

  const system = {
    type: { value: "martialM", baseItem: "" },
    price: parseCost(entry.cost),
    weight: { value: entry.weight, units: "lb" },
    damage: { base: { number: 1, denomination: p.damage.replace(/^\d*d/, "") || null, types: [p.type] } },
    properties: ["combination", ...Array.from(pProps)]
  };

  const desc = `<p><strong>${p.label} (Primary):</strong> ${p.damage} ${p.type}; ${p.props.replace(/,/g, ", ")}</p>
<p><strong>${entry.secondary.label} (Secondary):</strong> ${entry.secondary.damage} ${entry.secondary.type}; ${entry.secondary.props.replace(/,/g, ", ")}</p>
<p><em>Combination speed: ${entry.speed}.</em> Profile-switching is handled via Activities on this item — see the module's Combination Weapon guide.</p>`;

  return {
    name: entry.name,
    type: "weapon",
    img: "icons/svg/sword.svg",
    system: { ...system, description: { value: desc } },
    flags: {
      [MODULE_ID]: {
        propValues: pVals,
        combination: { speed: entry.speed, primary: entry.primary, secondary: entry.secondary }
      }
    }
  };
}

function buildArmorItem([name, tier, cost, baseAC, dexCap, strReq, stealth, weight, spikeDamage]) {
  const typeMap = { light: "light", medium: "medium", heavy: "heavy" };
  return {
    name,
    type: "equipment",
    img: "icons/svg/shield.svg",
    system: {
      type: { value: "armor", baseItem: "" },
      armor: { type: typeMap[tier], value: baseAC, dex: dexCap },
      price: parseCost(cost),
      weight: { value: weight, units: "lb" },
      strength: strReq || null,
      properties: stealth ? ["stealthDisadvantage"] : []
    },
    flags: { [MODULE_ID]: { spikeDamage } }
  };
}

function buildShieldItem([name, cost, acBonus, strReq, dmg, dmgType, propStr, weight]) {
  const { properties } = parseProps(propStr);
  return {
    name,
    type: "equipment",
    img: "icons/svg/shield.svg",
    system: {
      type: { value: "shield", baseItem: "" },
      armor: { type: "shield", value: acBonus },
      price: parseCost(cost),
      weight: { value: weight, units: "lb" },
      strength: strReq || null,
      properties: Array.from(properties)
    },
    flags: { [MODULE_ID]: { improvisedDamage: `${dmg} ${dmgType}` } }
  };
}

export function getAllItemData() {
  const items = [];
  SIMPLE_MELEE.forEach(r => items.push(buildWeaponItem(r, "simpleM")));
  SIMPLE_RANGED.forEach(r => items.push(buildWeaponItem(r, "simpleR")));
  MARTIAL_MELEE.forEach(r => items.push(buildWeaponItem(r, "martialM")));
  MARTIAL_RANGED.forEach(r => items.push(buildWeaponItem(r, "martialR")));
  ADVANCED_MELEE.forEach(r => items.push(buildWeaponItem(r, "martialM")));
  FIREARMS.forEach(r => items.push(buildWeaponItem(r, "martialR")));
  TOMMYBOWS.forEach(r => items.push(buildWeaponItem(r, "martialR")));
  COMBINATION_WEAPONS.forEach(e => items.push(buildCombinationItem(e)));
  ARMOR.forEach(r => items.push(buildArmorItem(r)));
  SHIELDS.forEach(r => items.push(buildShieldItem(r)));
  return items;
}
