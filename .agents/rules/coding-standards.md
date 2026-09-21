# 🎨 Bocchy Browser Coding Standards & Architectural Rules

## 1. Electron & WebContentsView Rules
- Always use `WebContentsView` instead of outdated `BrowserView` or `<webview>` tags.
- Bounds management: Calculate active tab view bounds using `getContentSize()` minus `topBarHeight` (92px or 126px with bookmarks).
- When entering HTML5 full screen, always expand view bounds to `(0, 0, width, height)` and hide top bars.
- Prevent memory leaks: Always clean up event listeners, debouncers, and timers when tabs are closed.

## 2. React & Tailwind Guidelines
- Keep UI consistent with the signature Bocchy aesthetic: Bubblegum Pink (`#ec4899` / `#fa5c8d`), subtle gradients, Dark Slate (`#18181f`), and translucent pill omnibox styling.
- Interactive popups/modals must have smooth entrance animations (`animate-in fade-in zoom-in-95` or `slide-in-from-right`), backdrop-blur, and clear dismiss buttons.
- All strings displayed to the user must support bilingual localization (`th` and `en`) via `src/renderer/src/i18n.ts`.

## 3. AdShield Protection Standards
- Network blocking via `onBeforeRequest` must use fast `Set.has()` domain lookups and LRU cache.
- Cosmetic CSS hiding must run on both `dom-ready` and `did-finish-load`.
- Dynamic DOM cleanups must use `MutationObserver` with early-exit markers (`data-bocchy-ad-blocked`) to avoid CPU overhead.
