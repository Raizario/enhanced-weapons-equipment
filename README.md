# Enhanced Weapons, Equipment & Rules — v0.1.10 experimental

**Requirements:** Foundry V14 + dnd5e V6. Test in a backup world.

- Combination weapon selector with Primary/Secondary profile editor.
- Each profile has removable multi-select property chips, damage dice or custom formula, and damage type.
- Weapon Mastery selector: No, Yes (independent), or Combination (bound to profile).
- Combination profile switching attempts to update dnd5e V6 native base damage and properties, preserving unrelated Activities and settings.
- Momentum and Flexible now generate Attack Activities (instead of Utility prompts) using separate configurable damage. These are **experimental** and should be verified for correct attack modifier, damage, and action economy in the live system.
- Existing combat initiative tracking and equip-aware AC logic preserved without code changes.

**Migration:** Existing Combination weapons need their primary and secondary profile information entered in the new editor. This version cannot infer distinct historical damage and property configurations from older weapons, and it does not retroactively recover previously erased properties.

**Known limitations:** The Combination profile editor changes base damage and active properties; it does not yet handle profile-specific ranges, attack types, or special rules beyond properties. The dedicated native attack activities for Momentum and Flexible need live validation. No Midi-QOL requirement.
