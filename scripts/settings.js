import { synchronizeAcBonus } from "./ac-effects.js";
import { MODULE_ID } from "./constants.js";

export function registerSettings() {
  game.settings.register(MODULE_ID,"rerollInitiativeEachRound",{
    name:"Reroll Initiative Each Round",
    hint:"GM-only: rolls initiative when combat begins and on each new round; revisiting an earlier round restores its saved rolls instead of rolling again.",
    scope:"world",config:true,type:Boolean,default:false
  });
  game.settings.register(MODULE_ID,"automateDefensiveParryAC",{
    name:"Automate Defensive / Parry AC",
    hint:"Grants +1 AC for each equipped Defensive property and each equipped Parry property (including active Masteries). These bonuses stack. Parry's offhand Finesse requirement is NOT automatically checked; unequip the weapon when ineligible.",
    scope:"world",config:true,type:Boolean,default:false,
    onChange: () => { if(game.user?.isGM) for(const actor of game.actors) void synchronizeAcBonus(actor); }
  });

  game.settings.register(MODULE_ID, "automateLacerate", {
    name: "Automate Lacerate",
    hint: "When enabled, hitting a creature with a Lacerate weapon automatically applies/escalates the laceration and rolls its damage at the start of the creature's turn. Disable to track it manually.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "loudFireSound", {
    name: "Loud Weapon — Fire Sound",
    hint: "Audio file played when a weapon with the Loud property is fired. Leave blank for no sound.",
    scope: "world",
    config: true,
    type: String,
    filePicker: "audio",
    default: ""
  });

  game.settings.register(MODULE_ID, "loudEmptySound", {
    name: "Loud Weapon — Dry Fire Sound",
    hint: "Audio file played when a Loud weapon is fired with no ammunition remaining. Leave blank for no sound.",
    scope: "world",
    config: true,
    type: String,
    filePicker: "audio",
    default: ""
  });
}

export function isLacerateAutomated() {
  return game.settings.get(MODULE_ID, "automateLacerate");
}

export function playLoudSound(key) {
  const path = game.settings.get(MODULE_ID, key);
  if (path) foundry.audio.AudioHelper.play({ src: path, volume: 0.8, autoplay: true, loop: false }, true);
}
