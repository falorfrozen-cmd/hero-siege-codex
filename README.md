# Hero Siege Codex

Explore items, classes, creatures, and the world.

An English offline reference archive for Hero Siege, created by **Falor**. This repository distributes Windows desktop builds and their release documentation.

## Install with Hero Siege Toolkit

1. Open [Hero Siege Toolkit](https://github.com/falorfrozen-cmd/hero-siege-offline-toolkit) and refresh its library while online.
2. Search for **Hero Siege Codex**, then select **Install**.
3. Select **Launch**. The downloaded archive works offline.

Toolkit manages the Portable ZIP and verifies its checksum against its signed catalog. Existing Toolkit 1.0.5 installations can discover the entry without a Toolkit upgrade. It appears under **All** and search with the standard fallback icon.

## Download separately

[Download the latest desktop release](https://github.com/falorfrozen-cmd/hero-siege-codex/releases/latest).

- **Portable ZIP:** extract the whole archive and run `hero-siege-item-codex.exe`.
- **Setup:** installs for the current Windows user and registers `hscodex:` entry links. Toolkit users should use the Toolkit-managed portable edition instead.
- **SHA256SUMS.txt:** checksums for the published downloads.

Requires 64-bit Windows 10 or 11 and Microsoft Edge WebView2. Toolkit already uses WebView2. Standalone setup can download the runtime when it is missing.

## Included in 0.5.0

- Item Archive: 1,990 equipment entries and 167 relics.
- Stat Archive: 89 descriptions from the game's English text.
- Class Archive: 24 illustrated classes and their skills.
- Creature Archive: 325 entries with custom Codex illustrations and field-guide information.
- World Archive: 217 Ether nodes and 200 quests.
- Unified search, bookmarks, entry links, optional lore and the Scholar's Index interface.

The archive does not read or modify game saves and needs no running game or administrator access. Each release is a fixed data snapshot. Toolkit offers updates when a newer desktop package is published in its signed catalog; the app does not synchronize with the website.

Use **File > Open entry link...** or **Ctrl+O** to paste a shared entry link in either edition. The portable edition does not register the Windows link protocol. External social links require internet.

## Public test edition

Version 0.5.0 is a public test build. Read the included `TEST_RESULTS.md` for completed checks and remaining device coverage. Missing or unconfirmed game information stays labelled in the archive; this is not a claim to document every current game mechanic.

Use **Report an issue** inside the app to copy the entry and version information, then [open an issue](https://github.com/falorfrozen-cmd/hero-siege-codex/issues). Include your Windows version, display scaling, reproduction steps and a screenshot. Do not include personal saves or credentials.

The Windows executable is unsigned. Game data and original artwork belong to their respective owners; dependency notices and source-snapshot provenance are included in every ZIP. Unofficial fan project, not affiliated with Panic Art Studios.
