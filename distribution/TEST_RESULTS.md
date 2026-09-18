# Desktop Test 0.5.0 — verification

Release review: 18 September 2026. Website snapshot: `888939603820819ab321222f34fc27744c54e3d5` (UI release `2026.09.18-r3`). The exact snapshot is also recorded in `web-source.json`.

## Included improvements

The current Scholar’s Index is included across all six archives, including illustrated/paginated indexes, compact item reading layout, contextual filtered counts, conditional Show lore and corrected optional-section anchors. Report an issue includes a desktop entry link and the desktop/UI versions; it sends nothing automatically. Initial window dimensions account for the monitor work area and Windows scaling. The native window uses the light theme matching the ivory reader.

## Automated checks

- Desktop TypeScript passes.
- 1,990 unique item identities, all item images, variants, creator marks and invalid links pass.
- 1,454 other archive links, their record files and 1,991 structured asset references pass.
- Desktop issue reports preserve identity, variant zero and creator marks, identify version 0.5.0 and omit unknown query parameters. Invalid routes remain reportable.
- Every one of the 3,638 public bundle files matches its source SHA-256. All 3,444 unified-search destinations round-trip through desktop links. The entry HTML, referenced boot assets and release title are present. Hosting/authentication files are not packaged.
- Optimized Rust/Tauri release and the Windows x64 NSIS installer both build successfully. EXE file/product version is 0.5.0.

## Interface checks

The actual release EXE was launched on this Windows machine and inspected through Windows accessibility and a native screenshot. Its Class Archive renders Paladin with the painting separate from the description and Previous/Next visible. Native World Archive content and its navigation are also present. No startup error was written to the captured stderr log. This is a native launch/visual check, not a full installer or native end-to-end acceptance test.

The exact compiled static bundle was also checked in the browser:

- At 720×540, Shadows retains all 19 properties. Document dimensions match the viewport and Previous/Next end at y=528.8, inside the screen.
- Ctrl+O opens a desktop link to Mika, preserving the Graxy_TV marked entry and both supplied social destinations. All 15 properties remain present.
- Report an issue opens from the collapsed navigation, includes both release identifiers and the correct hscodex link, and copies the exact preview text. At 720×540 its expanded dialog stays within x=72/y=16/w=576/bottom=524, without horizontal overflow.
- At 1280×720, Strength, Exo/Supernova, Gurag, Vadjra and The Light of Dawn render correctly. Exo has 18 skills; the linked Supernova icon loads and its section starts at y=156.2 below the sticky contents control. The quest retains all nine objectives. Checked pages do not overflow horizontally; browser error logs are empty.

## Distribution and remaining tester coverage

Setup and portable ZIPs include README, this report, provenance, dependency notices and SHA-256 checksums. All archive data, artwork, fonts and search are bundled. Internet is needed only for external social links and for setup to obtain Microsoft WebView2 if it is absent. The website's private access setting does not restrict the offline archive.

The installer was not installed over the owner's existing edition. Fresh-machine installation/uninstallation, Windows protocol registration, native cold-launch links, physically disconnected operation, restart persistence, different display scaling and low-end hardware still need tester coverage. Browser viewport checks do not claim physical-device FPS or universal rendering perfection.

The snapshot is not a claim of complete current-game knowledge: encounter evidence was reviewed against 7.0.12.0; 25 appearances remain unconfirmed. Existing data limitations remain visible in About the records.

The EXE and setup are unsigned. There is no automatic update or cloud synchronization. Previous-release results are not represented as current verification.
