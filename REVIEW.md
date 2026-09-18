# Hero Siege Codex 0.5.0 — initial full-source review

Version **0.5.0** is the first source release of this standalone Scholar's Index application. This pull request targets `main` and introduces the complete application: desktop shell, UI, every archive, data, artwork, build configuration and tests. Review the whole application as a new project.

The complete tracked desktop snapshot comes from `060758e6e8cfa39aad8390b070ec0d873af2b705`. No earlier desktop source commits or comparison baseline are part of this branch's history. The shared ancestor is the repository's initial distribution-documentation commit.

## Review structure

1. **Bundled archive data and artwork:** offline images, fonts, data files, desktop icons and dependency notices.
2. **Complete desktop application:** all runtime code, UI, build configuration, tests and documentation.

These two initial commits keep the code review readable while retaining every asset required for a self-contained build. Focused review corrections follow them in separate commits. GitHub collapses generated reference material by default. All files remain available in the branch tree; use the code commit and the entry points below when the overall diff is large.

## Application map

| Area | Start here | Review focus |
| --- | --- | --- |
| Native desktop | `src-tauri/src/main.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/main.json` | Window sizing, navigation boundaries, external links, deep links and permissions |
| Boot and routing | `src/main.tsx`, `src/routes.tsx`, `src/links.ts`, `vite.config.ts` | Archive loading, desktop/browser adapters and invalid-link handling |
| Scholar's Index UI | `web/app/scholar/`, `src/desktop.css` | Reading layout, keyboard use, dialogs, navigation, search and index pagination |
| Items | `web/app/catalog.tsx`, `web/app/scholar/item-record.tsx`, `web/lib/catalog.ts` | Properties, rarity, variants, bookmarks, lore and related entries |
| Classes | `web/app/class-study/`, `web/lib/class-reader.ts` | Class descriptions, artwork, skills and skill links |
| Stats | `web/app/stat-archive/`, `web/lib/stat-archive.ts` | Original descriptions, references and navigation |
| Creatures | `web/app/creature-archive/`, `web/lib/creature-archive.ts` | Creature records, illustrations, filters and evidence labels |
| Relics and world | `web/app/relic-archive/`, `web/app/world-archive/`, corresponding `web/lib/` modules | Relics, Ether nodes, quests, objectives and links |
| Reports | `src/issue-report.ts`, `web/app/scholar/issue-report.tsx` | Entry identity, version information and optional clipboard use |
| Build and distribution | `package.json`, `src-tauri/Cargo.toml`, `scripts/package-release.ps1` | Dependencies, offline packaging and release provenance |
| Verification | `scripts/test-*.mjs`, `distribution/TEST_RESULTS.md` | Automated coverage and remaining native/device checks |

## Run and validate

Use Node.js 22.18+ (or a newer supported release). Native Windows builds also require Rust MSVC, Visual Studio C++ Build Tools and Microsoft Edge WebView2.

```sh
npm ci
npm test
npx tsc --noEmit
npm run build:web
node scripts/test-bundle.mjs
```

Use `npm run dev` for the browser preview, or `npm run build` for the Windows installer. A browser preview does not replace native testing.

The checked-in `web/` snapshot contains everything needed to build this application. `scripts/sync-website.ps1` is a maintainer import operation requiring a separate website checkout; do not run it merely to review this release.

The optional native QA helpers use the repository's pinned Playwright dependency and target the current Scholar's Index. Run them against a Windows release EXE using [the native QA instructions](scripts/NATIVE_QA.md). They are separate from `npm test` because they require a running WebView2 application. See `distribution/TEST_RESULTS.md` for the original release checks and `scripts/NATIVE_QA.md` for the subsequent native review verification.

## Release status

The 0.5.0 public test EXE was published before this review was requested. This source PR is open for review and does not replace the release assets, update the Toolkit catalog or deploy the website. Findings that change shipped code should receive a new release version instead of overwriting the existing download.

Environment files, hosting/authentication state, build outputs, local QA captures and unrelated Git history are excluded. Source-snapshot provenance is recorded in `web-source.json`; dependency and game-content attribution is in `distribution/THIRD_PARTY_NOTICES.txt`.
