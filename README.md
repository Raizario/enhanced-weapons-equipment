# Enhanced Weapons, Equipment & Rules — v0.1.4 test build

Target: Foundry VTT 14 and dnd5e system 6.x. **This build has not yet been live-tested in Foundry.**

## Changes
- Includes scripts/ and lang/ at the paths declared in module.json.
- Keeps custom weapon properties registered on the native dnd5e sheet.
- Adds a managed Weapon Properties section to item descriptions when a weapon property is toggled or an item description is edited. Leaves text outside the managed markers alone.
- Editable Lacerate starting die, Flexible/Momentum damage, Loud radius, and Combination speed fields on weapon item sheets. Saves using Item flags on change.
- Removes the Lacerate Magical Bonus sheet field. The eventual bleed mechanic must not receive magical bonuses.
- Disables legacy rollDamageV2 and combat-turn Lacerate automation because it was unsafe and unverified on dnd5e 6.
- Suspends legacy compendium auto-build pending a dnd5e 6 schema conversion and requested category folders.

## Install & test
1. **Back up the world.** Do not test this on a live campaign first.
2. Push this package's `module.json`, `scripts/`, and `lang/` to your GitHub repository's `main` branch.
3. Create GitHub release `0.1.4` and attach `enhanced-weapons-equipment.zip` (the zip contents should begin with `module.json`, `scripts/`, `lang/`, NOT a parent folder).
4. Install/update the module in Forge from the manifest URL in `module.json` (or use your normal custom module path). Restart and enable it in your world.
5. Create a fresh test weapon. Check a custom property, close and reopen the sheet, and inspect the Description tab.
6. Set Lacerate starting die and confirm both the setting and description update.
7. Disable a checked property; confirm its generated entry disappears and all your manually authored text stays intact.
8. If you have old weapons, open Foundry Console and run:
   `await game.modules.get('enhanced-weapons-equipment').api.refreshDescriptions(game.items.contents);`
   **Only run after a backup**. Embedded actor weapons: pass `actor.items.contents` instead.

## Known limitations
- The V14 dnd5e 6 item sheet's DOM markup and hook name are not verified in a live Forge world. If the value fields do not appear, inspect the console and provide a screenshot; description generation is independent of sheet injection.
- Existing item descriptions won't be backfilled automatically. Backfill via API method above or by editing each item.
- Combat automation, Activities, Masteries, and a complete drag-and-drop compendium are NOT included in this test build.
- The original module's compendium-data.js predates dnd5e 6 and the newer PDF; do not use it as a reliable v1.7.1 inventory yet.
