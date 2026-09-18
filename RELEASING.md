# Publishing a desktop package

This is a distribution repository. Keep the website, authentication configuration and local build workspace out of it. Publish built desktop packages as release assets, together with their documentation and checksums.

## Asset contract

- Release tag: `v<major>.<minor>.<patch>`.
- Toolkit asset: `HeroSiegeItemCodex-<version>-Windows-x64-Portable.zip`.
- The ZIP has `hero-siege-item-codex.exe` at its root, alongside README, verification report, dependency notices, snapshot provenance and checksums.
- Publish `SHA256SUMS.txt` with a checksum line for every download.
- Keep an existing release's bytes immutable; fixes receive a new version.

Toolkit's generator reads GitHub's latest published, non-prerelease release. Version 0.5.0 is labelled **Public test** in its title and documentation and published on this channel so existing Toolkit clients can install it. GitHub prereleases are not discovered by the current generator.

## Update the Toolkit catalog

After publishing the package, run:

```sh
gh workflow run catalog.yml --repo falorfrozen-cmd/hero-siege-offline-toolkit --ref main -f only=hero-siege-codex
```

The workflow downloads and hashes the ZIP, verifies the executable path and checksum sidecar, signs the catalog and opens a pull request. Review that only the intended entry changed, verify checks, then merge it. `Catalog publish` uploads the signed pair that installed Toolkits fetch.

Publishing a Codex release alone does not update the Toolkit catalog. This distribution repository does not store a cross-repository dispatch token; use the manual workflow above. Never upload a hand-edited or unsigned Toolkit catalog.
