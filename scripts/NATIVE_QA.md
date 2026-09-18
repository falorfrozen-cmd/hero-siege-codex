# Native Scholar's Index checks

These optional Windows checks attach to the actual Tauri/WebView2 application. They use `playwright` from this project's pinned development dependencies; no maintainer runtime path or separate Chromium download is required. `npm test` remains the portable data/link/report suite and does not run these checks.

## Run

1. Install dependencies with `npm ci` (Node.js 22.18+). Microsoft Edge WebView2 must be installed.
2. Build the release EXE with `npm run build`, or use the matching portable EXE. Close any normal Codex instance before starting: the application is single-instance.
3. From the repository root, launch the dedicated QA process:

   ```powershell
   npm run qa:launch
   # Alternatively, pass the matching portable/release EXE explicitly:
   npm run qa:launch -- 'C:\path\to\hero-siege-item-codex.exe'
   ```

   The launcher prints its PID and saves it in `qa/native-process.json`. The existing `ITEM_CODEX_QA=1` mode keeps the window hidden and uses an isolated profile, separate from normal reading preferences. CDP listens on loopback port 9238; that port must be free. Wait for the EXE to start before attaching. An explicitly started QA instance with another CDP endpoint can be selected with `CODEX_QA_CDP` for the following commands.

4. Capture the current archive and run the acceptance checks:

   ```powershell
   npm run qa:probe
   npm run test:native
   ```

   `qa:probe` captures the current Scholar article, screenshot and diagnostic JSON. `test:native` drives item navigation using rendered controls and compares exact item identities, properties, effects and lore against the checked-in data. It also checks all six rarities, search, filters, creator links, bookmark persistence, invalid links and back/forward. Native viewport emulation covers 1400×880, 1280×680 and 720×540. The reader may scroll vertically; the document must not overflow and both entry-navigation buttons must remain inside the viewport.

   The suite switches only the QA WebView context offline. Copy-link checks deliberately disable the clipboard API in the QA document to exercise manual-copy fallback without replacing the Windows clipboard. Social destinations are checked without opening them. Offline state and viewport overrides are restored on success or failure.

5. Close only the captured QA process, including after a failed check:

   ```powershell
   $qaProcess = Get-Content -LiteralPath qa/native-process.json | ConvertFrom-Json
   powershell -NoProfile -File scripts/close-qa.ps1 -CodexProcessId $qaProcess.pid
   ```

Outputs are in the ignored `qa/` directory: `native-probe.json`, `native-report.json`, viewport screenshots, and `native-failure.png` if a check fails. A failed check exits nonzero. A successful probe alone is not acceptance: inspect the verifier's exit code and report. Reuse is safe within the dedicated QA profile; the verifier handles an already-saved fixture.

## Review verification — 19 September 2026

Both helpers passed against the existing **0.5.0 Windows release EXE**, SHA-256 `31f37b4bbcb31a02753c14c10a7ace11046f6f2c303c31b6f1d56e88d0f5e25f`. Its `src`, `web` and `src-tauri` source trees match the application snapshot in this PR. All **20 native acceptance groups** passed, including 30 recorded layout checks, with zero renderer errors and zero external catalog requests. The native release was not rebuilt or republished for this test-tooling correction.

This is automated WebView2 offline/viewport testing, not evidence of physically disconnected networking, a fresh-machine installation, protocol registration, native cold-launch links, process-restart persistence, physical DPI coverage or performance on other hardware. The original published release report in `distribution/TEST_RESULTS.md` remains unchanged.
