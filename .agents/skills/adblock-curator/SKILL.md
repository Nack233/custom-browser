---
name: adblock-curator
description: >-
  Use this skill when the user reports an unblocked ad, gambling banner, popunder, redirect, or asks to block ads on specific websites (like anime, manga, streaming, or pirate sites).
---

# AdShield AdBlock Curator Skill

This skill provides a systematic runbook for analyzing, creating, and verifying ad blocking rules in Bocchy Browser across network, cosmetic, and DOM cleaner layers.

---

## 🔍 Step 1: Analyze the Ad Element / Request

When given an ad snippet or URL (e.g. `<img src="..." alt="Advertisement">` or a redirect link):

1. **Identify the Type of Ad:**
   * **Banner / Image Ad:** Look at tag (`<img>`, `<iframe>`, `<picture>`), dimensions (`728x90`, `300x250`, `728x200`), attributes (`alt`, `title`, `aria-label`), and wrapping anchor `<a>`.
   * **Popunder / Redirect:** Look at the target domain or redirect script (`window.open`, `click` listeners, links to betting/gambling sites).
   * **Dynamic Script / Anti-Adblock:** Look for external JS scripts, base64 payloads, or inline timer insertions.

---

## 🛠️ Step 2: Implement the Fix Across 3 Layers

Always choose the least intrusive, most robust layer(s):

### Layer A: Cosmetic CSS Filtering (`src/main/viewManager.ts`)
* Best for: Ads hosted on legitimate CDNs or mixed with first-party content where network blocking might cause collateral damage.
* Open `src/main/viewManager.ts` inside `injectCosmeticAdBlock`:
  ```css
  /* Target attribute variations with case-insensitive matching */
  img[alt*="target_word" i],
  a:has(> img[alt*="target_word" i]),
  div:has(> a > img[alt*="target_word" i]) {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
    height: 0 !important;
  }
  ```
* **Best Practice:** Always hide the wrapping anchor (`a:has(...)`) to eliminate "ghost clicks".

### Layer B: Network Request Blocking (`src/main/adblocker.ts`)
* Best for: Third-party ad network domains, gambling networks, or image banner URLs.
* Open `src/main/adblocker.ts`:
  * Add domain to `blockedDomains` Set if it is an ad network.
  * Update `isAdOrTracker` image / banner dimension regex if it's a dimensional ad.
  * Update `isRedirectAd` if it's an unwanted popup/redirect destination.

### Layer C: Dynamic DOM Cleaner & Counter (`src/main/viewManager.ts`)
* Best for: SPAs or ad scripts that re-insert elements after page load.
* Add the selector to `purgeAds` / `cleanAds` query list inside `injectCosmeticAdBlock`:
  ```javascript
  var selectors = [
    'img[alt*="target_word" i]',
    ...
  ];
  ```
* Ensure it logs `__bocchy_ad_blocked__:<src>` so the AdShield Counter records it.

---

## 🧪 Step 3: Verification & Build

1. Run build verification:
   ```bash
   npm run build
   ```
2. Verify:
   * Zero collateral damage (legitimate navigation, avatars, video players still work).
   * No CPU spikes (MutationObserver skips elements with `data-bocchy-ad-blocked`).
   * Ad count increments in the AdShield panel.
