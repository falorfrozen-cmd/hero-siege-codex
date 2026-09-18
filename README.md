# Hero Siege Item Codex — Desktop Test 0.4.0

An English, offline Windows x64 test edition created by Falor. Uses the Scholar’s Index interface with an evergreen archive rail, readable ivory entries, on-page section navigation and unified search across 3,444 destinations. The exact website source commit is recorded in web-source.json.

## Included

- Item Archive: 1,990 equipment entries and 167 relics.
- Stat Archive: 89 original game descriptions.
- Class Archive: 24 illustrated classes and their skill descriptions/icons.
- Creature Archive: creatures, bosses, custom Codex illustrations and verified field-guide content.
- World Archive: 217 Ether nodes and 200 quests with 310 objectives.
- Unified search (Ctrl+K), archive filters, reading positions, item bookmarks, Show lore and the Graxy_TV creator bookmark.

This fixed snapshot does not update or sync with the website, and does not read or modify game saves. Original records may include inactive event or legacy entries. Missing information remains labelled; this is not a claim to cover every game mechanic.

## Install and run

Recommended: run **HeroSiegeItemCodex-0.4.0-Setup.exe**, then launch **Hero Siege Item Codex** from the Start menu. Installation is for your Windows account.

Alternatively, extract the portable ZIP and run **hero-siege-item-codex.exe**. Microsoft Edge WebView2 must already be installed. The setup version can download WebView2 from Microsoft if missing; this first step requires internet. The packaged archive works offline. Twitch and Discord open in your default browser and require internet.

This test build is unsigned. Windows may identify it as an unknown publisher. Check the sender and supplied SHA-256 checksum before deciding whether to run it.

## Share an entry

Copy buttons produce `hscodex:` links. An installed copy registers these links with Windows. Recipients need this version to open the new archives.

In either edition, use **File → Open entry link…** or **Ctrl+O** to paste a link. This also accepts existing Item Codex website links. Item variants and creator bookmarks are preserved. Classes/skills, stats, creatures, relics, Ether and quests are supported.

## Please test

1. Open every archive, search for entries and use Previous/Next at both ends of each archive.
2. Resize/maximize the window. Check dense items, long skills and the nine objectives in The Light of Dawn quest.
3. Copy an entry, open it with Ctrl+O, then try an entry from another archive.
4. Close/reopen and check item bookmarks, lore preference and reading positions.
5. Disconnect internet, launch the app and browse several archives and images.

For reports, include version 0.4.0, Windows version, display scaling, entry link, reproduction steps and a screenshot. Do not send personal saves or credentials. Windows 10, fresh machines without WebView2 and low-end hardware still need wider testing.

Unofficial fan archive. Game data and artwork remain attributed to their respective owners. Creature illustrations are the Codex's custom interpretations.

## Development

Requires Node.js, Rust MSVC, Visual Studio C++ Build Tools and WebView2. Use `npm ci`, `npm test`, `npx tsc --noEmit` and `npm run build`. `scripts/package-release.ps1` produces setup and portable ZIPs with documentation and checksums.

`scripts/sync-website.ps1` refreshes five website source directories and applies explicit desktop sharing adapters. Hosting/authentication files are never copied. `web-source.json` identifies the source commit. Each archive loads a bundled page module; the release EXE needs no local server.

`--self-test` launches a hidden window with an isolated temporary WebView2 profile. Normal launches expose no debugging port.
