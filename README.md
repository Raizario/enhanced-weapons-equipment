# Enhanced Weapons, Equipment & Rules — v0.1.7.1 test build

Foundry V14 / dnd5e V6.

## Changes
- Repair English localization: property names, mastery selectors, generated descriptions, and chat messages now resolve proper labels instead of `EWE.Property...`.
- Update Mastery-switch chat messages to use the actor name and an italic, narrative announcement.
- Retain Farshot range scaling (1.5×, rounded upward to 5 feet), property toggles and reversible mastery switching.
- Improved legacy generated-description recognition for untranslated property-key headings.

**Not yet live-tested in Foundry.** Test on backup world and duplicate items. Affects new/generated sections when items are next updated; manual description text isn't globally rewritten. Combat Activities, effects and true combination profile transformations are not implemented by this build.

Release tag: `v0.1.7.1`; release attachment filename: `enhanced-weapons-equipment.zip`.

## v0.1.7.1 patch

Restores a three-column weapon-property checkbox layout on dnd5e v6 item sheets. No changes to mastery logic, translation, damage, or chat announcements.


## v0.1.8 — First automation pass (experimental)

New **world settings** under Configure Settings → Module Settings:

- **Reroll Initiative Each Round** (default OFF). The active GM rerolls initiative for non-defeated combatants when round 2 or later starts. Uses Foundry's normal combat initiative rolls; only the active GM rolls. Re-sorts combatants; conflicts are possible with other initiative modules.
- **Automate Defensive / Parry AC** (default OFF). An equipped weapon with Defensive or Parry gives a +1 AC Active Effect on its actor. Multiple matching weapons do not stack. Removing the weapon or disabling the setting removes the module-managed effect. Does not check the Parry offhand finesse restriction or Defensive tower shield restriction: GM/players must manage eligibility by unequipping.

**Safety:** Legacy Lacerate automatic damage is NOT enabled; its setting defaults OFF for new worlds. This is a test build, please back up world data before installation. No standalone font assets are included. No new Activities or compendium packs were created in this release.
