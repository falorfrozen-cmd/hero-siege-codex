# Rarity material frames and Falor publisher seal

Original catalog decoration created with the built-in image_gen tool. These frames and the publisher seal are not official game item art or additional game lore. The game sprites, shared Runeword emblem, rarity palette and data are preserved.

Final files:

- `public/frames/unholy-frame.webp`: 1000 × 294, 27,876 bytes.
- `public/frames/satanic-frame.webp`: 1000 × 294, 30,306 bytes.
- `public/frames/runeword-frame.webp`: 1000 × 294, 32,134 bytes.
- `public/frames/normal-frame.webp`: 1000 × 294, 29,094 bytes.
- `public/emblems/falor-seal.webp`: 128 × 128, 6,762 bytes.

All five files have real alpha transparency. Original drawings were retained; after explicit user authorization, local image processing cleaned only exterior checker/matte and preserved the enclosed dark fields and original metal/gem colors. Cleaned artwork was inspected on parchment and dark header composites, then resized and encoded as WebP. The original drawings, correction attempts and reproducible cleanup script are retained in the workspace's `_art/atelier-20260908` folder.

See [the original prompt set](atelier-prompts.md). Built-in transparency corrections were unsuccessful; they are retained separately in the workspace and are not used by the product.

Every nameplate reserves the same 1000:294 slot. Existing Angelic and Heroic artwork is preserved. Title and sprite safe areas are defined by frame-specific CSS variables, with live English titles fitted by the existing bounded fitter. Only frames belonging to rendered entries are requested. Decorative glints animate transform/opacity for 420 ms on interaction; reduced-motion preferences disable them. There is no new animation library or continuous animation loop.
