# Enhanced Weapons, Equipment & Rules — v0.1.9 (Activity Preview)

**Foundry V14 / dnd5e V6 test build.** Back up your world before testing.

## Included from the v0.1.8.1 corrections

- Defensive and Parry AC bonuses can stack; managed bonuses are removed when the weapon is unequipped.
- Initiative rolls are saved per Combat round and restored on previous/next navigation; the first round is rolled upon combat start.
- The established three-column property UI, property descriptions, Mastery controls, and Farshot range behavior remain.

## New in actual v0.1.9

- Creates a **Utility Activity** on weapons with two distinct Mastery choices: **Switch Mastery Stance** (Bonus Action) or **Change Weapon Profile** (Combination speed: Slow uses Action; other speeds use Bonus Action).
- The dnd5e `postUseActivity` hook changes the active mastery and posts the italic actor-named chat announcement once an Activity is used.
- Generates descriptive Utility Activities on applicable weapons for **Brace, Deflect, Brawler, Disarm, Drag, Trip and Flourish**. These are **prompts only**: they do not yet roll opposed checks, apply conditions, or change damage.
- Activity creation is automatically attempted for world items and actor-owned items; generated entries carry module flags to prevent replacing manually authored Activities.

## Important limits

- Generated Activities use dnd5e's API but have **not been tested in a live Foundry V14 game**. Check creation, activation timing, and one chat announcement per use.
- Combination profile switching changes active mastery but **does not yet swap the physical weapon's damage, range, or full profile data**.
- Fast Combination supports object interaction or Bonus Action in the PDF; this first Activity presents the Bonus Action route.
- Disarm / Drag / Trip are written as Action Activities to expose their rules, but in play they **replace one attack within the Attack action**, not necessarily your entire Action. This distinction is not yet system-automated.
- Initiative and equipped AC automations must be enabled in Module Settings.
