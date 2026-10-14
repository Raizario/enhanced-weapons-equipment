# Enhanced Weapons, Equipment & Rules — v0.1.6 test build

- Adds a **Switch Mastery/Profile** button to weapon details, changing the active mastery, adding/removing its property on the weapon, and announcing the switch in actor chat.
- Adds Farshot effective range multiplication (x1.5, ceil to nearest five) when it is the active mastery, restoring saved base ranges when inactive.
- Fixes Farshot English localization and updates its description to round up.
- Preserves the v0.1.5 generated-description cleanup and options.

## Important test limitations
- This is **not** a full mastery automation release: property-specific Active Effects (e.g., Defensive AC) and dynamic combat Activities are **not implemented** in this build. Existing attack Activities inherit the updated weapon range where the Activity does not override range.
- New effect and Activity generation is intentionally deferred: do not rely on it yet in live combat.
- Setting a mastery via controls refreshes the effective property via update hooks. The button announces manual stance changes; no automatic timing enforcement is applied.
- Do not independently edit homebrew property toggles **after** activating a mastery until baseline preservation is improved. Test on duplicate items / backup worlds.
- Combination switching uses the selected speed for the chat label; it does not enforce action economy or physically change weapon profiles/damage dice.
- No V14 live-runtime test was possible. Test on a backed-up world.
