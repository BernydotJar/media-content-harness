# Mascot Avatar System v1

Media Factory treats a reusable mascot as a product entity rather than a sticker.

```text
BrandAsset
  -> BrandCharacter
    -> AvatarIdentityPack
      -> Outfit + Accessories
      -> Motion Preset
      -> Scene Pack
        -> Avatar Compiler / Identity Lock
          -> Producer
          -> Avatar Critic
          -> Fixer / Regenerate
          -> Independent Verifier
          -> Release
```

## User model

A non-technical user chooses only:

`Avatar -> Look -> Accessories -> Action -> Scene -> Image/Video`.

The compiler owns identity-locking, brand-marker policy, reference roles, incompatibility rules, provenance and critic checklist.

## V1 versus a 3D rig

V1 uses structured generative motion profiles. It provides reusable identity and movement intent for image/video generators without claiming a skeletal rig exists. The data model includes a future `rig_profile` slot so a 2.5D/3D implementation can be added later without changing scene contracts.
