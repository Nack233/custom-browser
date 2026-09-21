import { Session, session } from 'electron';

export type SupportedLanguage = 'th' | 'en';

export class LocaleManager {
  private currentLanguage: SupportedLanguage = 'th';
  private registeredSessions: Set<Session> = new Set();

  constructor(initialLang: SupportedLanguage = 'th') {
    this.currentLanguage = initialLang;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public getAcceptLanguage(): string {
    return this.currentLanguage === 'th'
      ? 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7'
      : 'en-US,en;q=0.9,th;q=0.8';
  }

  public getLocaleCode(): string {
    return this.currentLanguage === 'th' ? 'th-TH' : 'en-US';
  }

  public getCountryCode(): string {
    return this.currentLanguage === 'th' ? 'TH' : 'US';
  }

  public getHlCode(): string {
    return this.currentLanguage === 'th' ? 'th' : 'en';
  }

  /**
   * Apply headers, user agent, and cookies to an Electron Session
   */
  public async applyToSession(targetSession: Session, lang: SupportedLanguage = this.currentLanguage): Promise<void> {
    this.currentLanguage = lang;
    this.registeredSessions.add(targetSession);

    const acceptLang = this.getAcceptLanguage();
    const hl = this.getHlCode();
    const gl = this.getCountryCode();

    // 1. Configure session User-Agent accept languages
    try {
      const currentUa = targetSession.getUserAgent();
      targetSession.setUserAgent(currentUa, acceptLang);
    } catch (e) {
      console.error('[Locale] Failed setting session User-Agent accept languages:', e);
    }

    // 2. Attach or update webRequest onBeforeSendHeaders
    try {
      targetSession.webRequest.onBeforeSendHeaders({ urls: ['*://*/*'] }, (details, callback) => {
        details.requestHeaders['Accept-Language'] = acceptLang;
        callback({ requestHeaders: details.requestHeaders });
      });
    } catch (e) {
      console.error('[Locale] Failed setting Accept-Language request header:', e);
    }

    // 3. Set localization cookies for major platforms (YouTube, Google)
    await this.setPlatformCookies(targetSession, hl, gl);
  }

  /**
   * Set PREF cookies on YouTube and Google so their server-rendered UI defaults to the selected language
   */
  private async setPlatformCookies(targetSession: Session, hl: string, gl: string): Promise<void> {
    const expireTime = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;

    const cookieTargets = [
      { url: 'https://www.youtube.com', domain: '.youtube.com' },
      { url: 'https://youtube.com', domain: '.youtube.com' },
      { url: 'https://m.youtube.com', domain: '.youtube.com' },
      { url: 'https://www.google.com', domain: '.google.com' },
      { url: 'https://google.com', domain: '.google.com' },
      { url: 'https://www.google.co.th', domain: '.google.co.th' },
      { url: 'https://google.co.th', domain: '.google.co.th' },
    ];

    for (const target of cookieTargets) {
      try {
        const existing = await targetSession.cookies.get({ url: target.url, name: 'PREF' });
        let prefVal = `hl=${hl}&gl=${gl}`;

        if (existing.length > 0 && existing[0].value) {
          let cur = existing[0].value;
          if (cur.includes('hl=')) {
            cur = cur.replace(/hl=[^&]*/g, `hl=${hl}`);
          } else {
            cur += `&hl=${hl}`;
          }
          if (cur.includes('gl=')) {
            cur = cur.replace(/gl=[^&]*/g, `gl=${gl}`);
          } else {
            cur += `&gl=${gl}`;
          }
          prefVal = cur;
        }

        await targetSession.cookies.set({
          url: target.url,
          domain: target.domain,
          name: 'PREF',
          value: prefVal,
          path: '/',
          secure: true,
          expirationDate: expireTime,
        });

        // If there were host-specific cookies that might conflict with domain cookie, clear them
        for (const c of existing) {
          if (c.domain && c.domain !== target.domain) {
            try {
              await targetSession.cookies.remove(target.url, 'PREF');
            } catch (e) {}
          }
        }
      } catch (err) {
        // Non-critical cookie set error
      }
    }
  }

  /**
   * Switch language for all registered sessions
   */
  public async setLanguage(newLang: SupportedLanguage): Promise<void> {
    this.currentLanguage = newLang;
    console.log(`[Locale] Switching browser web localization to: ${newLang} (${this.getLocaleCode()})`);

    // Ensure defaultSession is included
    this.registeredSessions.add(session.defaultSession);

    for (const sess of this.registeredSessions) {
      try {
        await this.applyToSession(sess, newLang);
      } catch (e) {
        console.error('[Locale] Error updating session locale:', e);
      }
    }
  }

  /**
   * JavaScript snippet to inject into webContents to override client-side navigator.language
   */
  public getInjectionScript(): string {
    const locale = this.getLocaleCode();
    const languages = this.currentLanguage === 'th' ? "['th-TH', 'th', 'en-US', 'en']" : "['en-US', 'en', 'th']";

    return `
      (function() {
        try {
          Object.defineProperty(navigator, 'language', {
            get: function() { return '${locale}'; },
            configurable: true
          });
          Object.defineProperty(navigator, 'languages', {
            get: function() { return ${languages}; },
            configurable: true
          });
        } catch(e) {}
      })();
    `;
  }
}
