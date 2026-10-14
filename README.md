# Enhanced Weapons — v0.1.9.1 (Foundry 14 / dnd5e 6)

**Patch to v0.1.9:** fixes Combination/Weapon Mastery property ownership and distinct transformation chat announcements. Preserves initiative history, separate Defensive/Parry AC effects, three-column property layout and Farshot.

- Preserves permanent weapon properties when a Mastery changes.
- Combination profile switching keeps its own Activity and distinct text, independent of standard mastery stance changes.
- Rebuilds generated Activities from saved permanent properties rather than momentary active checkboxes.
- Adds **Momentum — Charging Strike** and **Flexible — Follow-up Strike** rule-prompt Utility Activities. These are intentionally **not yet attack-roll Activities**; they do not change or roll weapon damage. This is safer until attack damage formulas and costs can be validated in Foundry.
- Brutal critical-hit damage automation remains pending rather than risking incorrect critical damage or overwriting existing custom critical modifiers.

**Important:** Back up your world and test on a duplicated weapon. Existing weapons previously damaged by the bad switch may require their manually selected properties restored once. The system cannot infer every erased custom property. For new weapons, changing Mastery should not remove permanent properties.

**Test:** Combination with Mastery enabled: switch profiles repeatedly, verify Combination remains checked and Change Weapon Profile persists, and check the transformation chat text. Switch standard Mastery on a non-Combination weapon and verify its own chat text. Reopen, reload and repeat. Ensure initiative/AC behavior remains unchanged.
