---
name: bocchy-ui-component
description: >-
  Use this skill when the user asks to add or redesign UI components, modals, flyouts, drawers, or new settings tabs in Bocchy Browser.
---

# Bocchy UI & Component Design Skill

This skill ensures any new UI elements strictly follow the aesthetic and architectural design system of Bocchy Browser.

---

## 🎨 Bocchy Design System Principles

1. **Color Palette:**
   * **Primary Accent:** Bubblegum Pink (`#ec4899` / `#fa5c8d` / `rgb(250, 92, 141)`)
   * **Secondary / Dark Base:** Dark Slate / Deep Obsidian (`#14141a`, `#18181f`, `#202024`)
   * **Borders & Dividers:** Subtle translucent borders (`border-pink-500/20`, `border-white/10`)
   * **Glassmorphism:** `backdrop-blur-xl` or `backdrop-blur-2xl` with 90-95% opacity backgrounds.

2. **Typography & Icons:**
   * Font: Clean sans-serif, monospaced fonts for versions, stats, and URLs (`font-mono`).
   * Icons: Exclusively use `lucide-react` icons.

3. **Animations:**
   * Use Tailwind animate utilities: `animate-in fade-in zoom-in-95 duration-100` for dropdowns, or `slide-in-from-right` for drawers.

---

## 📐 WebContentsView Layering Rules

> [!IMPORTANT]
> Bocchy renders web pages using Electron's native `WebContentsView`, which sits **on top** of HTML DOM by default unless bounds are handled properly.

* **TopBar Bounds Offset:**
  * Normal mode: `topOffset = 92`
  * Bookmarks Bar enabled: `topOffset = 126`
* Floating Modals, Drawers, and Flyouts must:
  * Position themselves below the TopBar (`style={{ top: `${topOffset}px` }}`).
  * If a full-screen modal or overlay is needed over the webpage, coordinate with `viewManager.hideActiveView()` or adjust the view bounds so the web content does not draw over the modal.

---

## 🌐 Localization (`i18n.ts`) Checklist

Every new button, title, and tooltip must support English (`en`) and Thai (`th`):
1. Open `src/renderer/src/i18n.ts`.
2. Add the translation keys under both `th: { ... }` and `en: { ... }`.
3. Consume via `const t = translations[language];`.

---

## 🔌 IPC Pipeline Checklist

If your component needs to communicate with the main Electron process:
1. Define TypeScript interface in `src/types/browser.ts`.
2. Expose the API in `src/preload/index.ts` via `contextBridge.exposeInMainWorld('browserApi', ...)`.
3. Handle the IPC call in `src/main/index.ts` using `ipcMain.handle(...)`.
