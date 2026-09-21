---
name: bocchy-release
description: >-
  Use this skill when the user asks to release a new version or hotfix of Bocchy Browser, package the executable installers, or publish updates to GitHub.
---

# Bocchy Release & Packaging Workflow

This skill guides the AI agent step-by-step through bumping versions, building, testing, packaging, and pushing updates for Bocchy Browser.

## Release Steps

### Step 1: Version Bumping Checklist
Update the semantic version string in all required project files:
1. `package.json` -> `"version": "<new_version>"`
2. `src/renderer/src/components/UpdateLogModal.tsx` -> Update header badge, subtitle, changelog entry at top, and footer text
3. `src/renderer/src/components/SettingsPage.tsx` -> Update sidebar badge, about card version, and add changelog card in update log tab
4. `src/renderer/src/components/NavigationBar.tsx` -> Update What's New button version and tooltip
5. `src/renderer/src/components/MoreOptionsMenu.tsx` -> Update version badge text
6. `src/renderer/src/components/GlobalMediaPanel.tsx` -> Update version badge text
7. `src/renderer/src/i18n.ts` -> Update `whatsNew` text for both `th` and `en`
8. `README.md` -> Add new version section documenting new features/fixes

### Step 2: Verification Build
Execute the full build to ensure 0 TypeScript or bundler errors:
```bash
npm run build
```

### Step 3: Packaging (Optional / When Requested)
If the user requests application packaging or creating installer `.exe`:
```bash
npm run package
```
Installers will be generated in `release/`:
- `release/Bocchy Setup <version>.exe` (NSIS Installer)
- `release/Bocchy-Portable-<version>.exe` (Standalone Portable)

### Step 4: Git Commit & Push
Commit all modified files and push to remote:
```bash
git add -A
git commit -m "feat/fix: <summary of changes> (v<version>)"
git push origin main
```
