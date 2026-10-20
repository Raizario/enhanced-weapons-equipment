> **v0.1.10.2 compatibility patch:** dnd5e system requirement set to 5.3.3 (not yet validated in a running Foundry world). No game logic changed.

# Enhanced Weapons, Equipment & Rules — v0.1.10.2 test build

Target: Foundry VTT v14, dnd5e 6.x. This patch builds on v0.1.10.

## Changes
- New distinct Combination profile Attack Activities (`Primary: Attack` and `Secondary: Attack`, using the editable profile names), with individually configured damage dice, bonus, type, or custom damage formula.
- Profile-prefixed maneuver utility Activities (`Primary: Trip — Special Attack`, etc.).
- Flexible and Momentum are now generated as Attack Activities, including their own configured damage. When a property belongs to a Combination profile, its Activity receives that profile's name.
- Existing custom Activities are not owned by the module and are not removed.
- The editor attempts to preserve the current Details-tab scroll position after changing module fields.
- Initiative history and Defensive/Parry AC automation are left unchanged.

## Test caveats
- The generated attacks' schema and custom damage formulas require validation in a live Foundry v14 / dnd5e 6.x world. Inactive Combination profile attacks remain selectable; use the correct one manually.
- Profile-specific attack mode and range still need their own configuration and activity settings.
- Rebuilt generated Activities may discard manual edits to those module-owned activities. Do not customize generated Activities directly.
- Back up your world and test on duplicate weapons before using it in a campaign.

## Install
Upload the extracted GitHub source to main. Create release `v0.1.10.2` and attach the module archive as `enhanced-weapons-equipment.zip`. Refresh the Forge's manifest and restart the world.
