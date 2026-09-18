# Codex 0.5.0 source review

These branches make the existing desktop release available for code review:

- `review/baseline-0.4.0`: tracked desktop snapshot from `b5c367f`.
- `review/codex-0.5.0`: tracked desktop snapshot from `060758e6e8cfa39aad8390b070ec0d873af2b705`.

The pull request compares these two snapshots, rather than presenting thousands of unchanged archive assets as a first import. The head branch contains the complete desktop source and bundled archive assets. `main` remains the release distribution page. Merging this review into its baseline does not rebuild, replace or publish any release; leave it open until review is complete.

Version 0.5.0 was already published before this review was requested. The existing release tag, assets and Toolkit catalog are not changed by this PR. Findings requiring a code change should receive a new release version instead of replacing the 0.5.0 downloads.

## Suggested review order

1. `src-tauri/src/main.rs`: initial window sizing, monitor work area, light theme and native browser boundaries.
2. `src/issue-report.ts`, `web/app/scholar/issue-report.tsx`: entry identity, versioned reports, optional clipboard fallback and desktop link handling.
3. `web/app/scholar/shell.tsx`, `entry-contents.tsx`, `refinement.css`: navigation, reading layout, small-window dialogs and keyboard behavior.
4. `index-thumbnail.tsx`, `use-index-window.ts`, `web/lib/index-window.ts` and each archive component: illustrated pagination, search/filter counts and bounded index rendering.
5. `scripts/test-report.mjs`, `scripts/test-bundle.mjs`, `distribution/TEST_RESULTS.md`: automated coverage and limits of prior native/device checks.

## Reproduce the source checks

Use Node.js 22.18+ (or a newer supported release). A native Windows build also needs Rust MSVC, Visual Studio C++ Build Tools and WebView2.

```sh
npm ci
npm test
npx tsc --noEmit
npm run build:web
node scripts/test-bundle.mjs
```

For a Windows installer, run `npm run build`. For a browser-only preview, run `npm run dev`; this does not replace a native application test.

The checked-in `web/` directory is sufficient to build this snapshot. `scripts/sync-website.ps1` is a maintainer import operation requiring a separate sibling website checkout; do not run it just to review the packaged version. Some historical native QA helpers reference the maintainer's local Playwright installation and the former book layout. The verification report explicitly limits those older checks; use the commands above for the current source checks.

Runtime source and assets are preserved from the desktop snapshots. Environment files, hosting/authentication state, build outputs, local QA captures and unrelated historical commits are not included. Dependency and game-content attribution is in `distribution/THIRD_PARTY_NOTICES.txt`.
