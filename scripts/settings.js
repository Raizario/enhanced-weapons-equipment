import { MODULE_ID } from "./main.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "automateLacerate", {
    name: "Automate Lacerate",
    hint: "When enabled, hitting a creature with a Lacerate weapon automatically applies/escalates the laceration and rolls its damage at the start of the creature's turn. Disable to track it manually.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
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
