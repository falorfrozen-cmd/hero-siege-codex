# Desktop Test 0.4.0 — verification

Release review: 18 September 2026. The exact website source is identified in `web-source.json`. This release replaces the old book interface with the Scholar’s Index across Items, Stats, Classes, Creatures, Relics and World.

## Scope

The website production build, TypeScript, navigation/data suites and all 3,444 unified-search destinations have passed. Desktop TypeScript and link tests passed: 1,990 item links, 1,454 other archive links, all record files, 1,991 local asset references, and all 3,444 unified-search results round-trip through desktop links.

## Compiled interface verification

The production static bundle used by the desktop build was served locally in the browser. Mika retains all 15 properties; its original Attack Damage popover is readable. Item Copy link produces an hscodex link, and Ctrl+O opens it. Unified search distinguishes The Light of Dawn item from the quest and opens the quest with all nine objectives; Copy link preserves the world volume and entry. The Graxy_TV bookmark preserves its supplied Twitch and Discord links. Version 0.4.0 and the light theme are present in the rebuilt HTML. No browser console errors were recorded for this preview. These are browser checks, not native WebView2 UI automation.

The data remains a fixed snapshot. Creature encounter evidence was reviewed against 7.0.12.0. All 842 recorded English evidence texts still match installed game 7.0.13.0, but changed binaries prevent claiming current encounter behavior has been reverified. 25 appearances remain unconfirmed; no guessed combat or drop statistics were added.

## Native build and launch

The optimized Tauri release and NSIS installer build both completed. The executable reports file/product version 0.4.0. Its hidden `--self-test` mode was launched with an isolated temporary profile; the process remained responsive and started a Microsoft Edge WebView2 child. The test process was stopped afterward. This is an initial launch smoke check, not a full native UI or installer acceptance test.

Release ZIPs include setup/portable binaries, this report, README, third-party notices and SHA-256 checksums.

## Tester coverage still needed

The installer is not installed over the owner’s existing edition during packaging. Installation/uninstallation, Windows protocol registration, cold-launch links, physically disconnected operation, restart persistence and native window interaction require testing with this release. Browser viewport tests are not physical low-end-device tests.

Please test fresh Windows 10/11 x64 machines, display scaling and lower-end hardware. Setup can fetch Microsoft WebView2 if missing; that initial step needs internet. Archive data, illustrations, fonts and search are packaged locally. External Twitch and Discord links require internet.

EXE and setup are unsigned. There is no automatic update or cloud synchronization. Previous-release test results are not represented as current verification.
