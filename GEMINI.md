# 🌸 Bocchy Browser - Gemini & Antigravity Agent Guidelines

ไฟล์นี้เป็นคู่มือและกฎเกณฑ์หลัก (Project Instructions & Customization Rules) สำหรับ **Antigravity** และ **Gemini AI Coding Assistant** เพื่อให้เข้าใจสถาปัตยกรรมโค้ด กฎระเบียบของโปรเจกต์ และวิธีเพิ่ม Skills / Rules เพิ่มเติม

---

## 📌 สรุปภาพรวมโปรเจกต์ (Project Overview)
* **ชื่อโปรเจกต์:** Bocchy Browser (Bocchy)
* **เวอร์ชันปัจจุบัน:** v1.3.1
* **เทคโนโลยีหลัก:**
  * **Runtime:** Electron 34+ (Chromium 132+)
  * **Main Process:** TypeScript + esbuild (`scripts/build.mjs`, `src/main/`)
  * **Renderer Process:** React 18 + Vite 6 + Tailwind CSS 3.4 (`src/renderer/`)
  * **Browser Engine:** ใช้สถาปัตยกรรมโมเดิร์น `WebContentsView` (ไม่ใช่ Webview tag หรือ BrowserView รุ่นเก่า)
  * **Icons:** `lucide-react`
  * **บรรจุภัณฑ์ (Packaging):** `electron-builder` (NSIS Installer + Portable Executable)

---

## 🛠️ กฎเกณฑ์และมาตรฐานการพัฒนาโค้ด (Coding & Architecture Rules)

### 1. สถาปัตยกรรม WebContentsView
* หน้าต่างเว็บแต่ละแท็บถูกจัดการผ่าน `WebContentsView` ใน `src/main/viewManager.ts`
* การคำนวณขนาด (Bounds):
  * ความสูงของ TopBar ปัจจุบันคือ `topBarHeight = 92` (หรือ `126` หากเปิด Bookmarks Bar)
  * หากอยู่ในโหมดวิดีโอเต็มจอ (`handleEnterHtmlFullScreen`) ให้ขยายขนาด View เต็มขอบ `(0, 0, width, height)` พร้อมซ่อนแถบเครื่องมือ
* การลบและสลับแท็บ:
  * ต้องใช้ `mainWindow.contentView.removeChildView(view)` และ `mainWindow.contentView.addChildView(view)` เสมอ

### 2. ระบบบล็อกโฆษณา (AdShield Engine)
* การบล็อกมี 2 ระดับหลัก:
  1. **Network-level Blocker (`src/main/adblocker.ts`):** ดักจับผ่าน `webRequest.onBeforeRequest` กรอง URL/Domain โดเมนแทร็กเกอร์ แบนเนอร์ภาพ (`.gif`, `.webp`, `.png` มิติ `728x\d+`) และเว็บพนัน (`mahagame`, `ufa`, `slot` ฯลฯ)
  2. **Cosmetic & DOM-level Blocker (`src/main/viewManager.ts`):**
     * ฉีด CSS (`insertCSS`) ซ่อนองค์ประกอบ `img[alt*="Advertisement" i]`, `img[alt*="โฆษณา" i]`, `a:has(> img[alt*="Advertisement" i])` ในอีเวนต์ `dom-ready` และ `did-finish-load`
     * ฉีด DOM Cleaner script + `MutationObserver` เพื่อดักจับโฆษณาไดนามิกและส่งข้อความ `__bocchy_ad_blocked__:` ไปยัง `console-message` เพื่อนับยอดเข้าสถิติ AdShield ทันที

### 3. ระบบควบคุมเสียงและมีเดีย (Global Media Panel & Volume Mixer)
* ปรับระดับเสียงแท็บอิสระ (0% - 100%) ผ่าน `tab.view.webContents.setAudioMuted()` และการฉีด Script ปรับระดับ HTMLMediaElement
* ควบคุมการเล่นมีเดีย (YouTube, Spotify, SoundCloud ฯลฯ) ผ่าน `toggleMediaPlayback(tabId)` ใน `viewManager.ts`

### 4. กฎการปล่อยแพตช์ด่วนหรืออัปเดตเวอร์ชัน (Hotfix & Release Protocol)
เมื่อมีการสั่งให้อัปเดตเวอร์ชัน หรือปล่อย Hotfix ให้ปฏิบัติตามลำดับขั้นตอนดังนี้เสมอ:
1. **ปรับเลขเวอร์ชัน (Semantic Versioning):**
   * `package.json` (`"version": "x.y.z"`)
   * `src/renderer/src/components/UpdateLogModal.tsx` (Header, Subtitle, Changelog List, Footer)
   * `src/renderer/src/components/SettingsPage.tsx` (Sidebar badge, About card, Full-page update log)
   * `src/renderer/src/components/NavigationBar.tsx` (What's New badge & tooltip)
   * `src/renderer/src/components/MoreOptionsMenu.tsx` (Version badge)
   * `src/renderer/src/components/GlobalMediaPanel.tsx` (Version badge)
   * `src/renderer/src/i18n.ts` (`whatsNew` ทั้งภาษาไทยและอังกฤษ)
   * `README.md` (เพิ่มหัวข้อสิ่งใหม่ในเวอร์ชัน)
2. **ทดสอบ Build ก่อนส่งมอบ:**
   * รัน `npm run build` (ทดสอบ build:renderer และ build:electron) ให้ผ่าน 100%
3. **Commit และ Push ขึ้น GitHub:**
   * สเตจและคอมมิตด้วยข้อความที่ชัดเจน เช่น `fix(adblock): ... (vx.y.z hotfix)`
   * รัน `git push origin main`

---

## 🧩 ระบบการเพิ่ม Skills & Rules สำหรับ Antigravity / Gemini

Antigravity รองรับระบบ Customization ตามมาตรฐานโครงสร้างดังนี้:

### โครงสร้างไดเรกทอรีที่รองรับ (Supported Customization Paths)
```text
custom-browser/
├── GEMINI.md                                  # กฎหลักประจำโปรเจกต์ (โหลดอัตโนมัติทุกครั้ง)
├── AGENTS.md                                  # กฎหลักสำรอง (สำหรับ Multi-Agent Frameworks)
└── .agents/                                   # Workspace Customizations Root
    ├── rules/                                 # โฟลเดอร์เก็บกฎย่อยแยกตามหมวดหมู่
    │   ├── coding-standards.md
    │   └── adblock-rules.md
    └── skills/                                # โฟลเดอร์เก็บ Skills (ขั้นตอนทำงานแบบ On-Demand)
        └── <skill-name>/
            ├── SKILL.md                       # บังคับ: มี YAML frontmatter (name, description)
            ├── scripts/                       # (ไม่บังคับ) สคริปต์ตัวช่วย
            └── references/                    # (ไม่บังคับ) เอกสารอ้างอิงเพิ่มเติม
```

---

### วิธีสร้าง Rule ใหม่ (Adding a New Rule)
1. สร้างไฟล์ markdown ใน `.agents/rules/<ชื่อกฎ>.md`
2. หรือเพิ่มข้อกำหนดลงใน `GEMINI.md` ได้โดยตรง
3. **ตัวอย่าง Rule:**
   ```markdown
   # UI Consistency Guidelines
   - สีธีมหลักของเบราว์เซอร์คือ Pink (#ec4899 / #fa5c8d) ผสม Dark Slate (#18181f)
   - หน้าต่าง Modal หรือ Flyout ต้องมี backdrop-blur และปุ่มปิด (X) เสมอ
   ```

---

### วิธีสร้าง Skill ใหม่ (Adding a New Skill)
Skill คือชุดคำสั่งแบบเจาะจง (Runbook / Workflow) ที่ Agent จะดึงมาใช้เฉพาะเมื่อตรงกับคำขอของผู้ใช้ โดยประหยัด Context Window

1. สร้างโฟลเดอร์ `.agents/skills/<skill-name>/`
2. สร้างไฟล์ `SKILL.md` โดย**ต้องมี YAML frontmatter** ด้านบนสุด:
   ```markdown
   ---
   name: bocchy-package-app
   description: >-
     Use this skill when the user requests to package or build Bocchy Browser installers (NSIS or Portable exe).
   ---

   # Bocchy Package App Skill

   ## Steps to Package:
   1. Ensure all changes are committed or stashed.
   2. Run `npm run build` to ensure renderer and electron compile cleanly.
   3. Run `npm run package` to execute electron-builder.
   4. Output will be generated in `release/Bocchy-Portable-x.y.z.exe` and `release/Bocchy Setup x.y.z.exe`.
   ```

---

## ⚡ คำสั่งลัดที่มีประโยชน์ (Useful CLI Commands)
* `npm run dev`: เริ่มต้นโหมดพัฒนาพร้อม Hot-reload
* `npm run build`: คอมไพล์โปรเจกต์ทั้ง Renderer และ Electron
* `npm run package`: บิลด์ไฟล์ติดตั้ง NSIS และ Portable `.exe` ลงในโฟลเดอร์ `release/`
* `git status`: ตรวจสอบสถานะการเปลี่ยนแปลงโค้ด
* `git push origin main`: อัปโหลดโค้ดขึ้น GitHub
