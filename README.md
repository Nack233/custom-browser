# 🌸 Bocchy Browser

<div align="center">
  <img src="bocchy.png" alt="Bocchy Browser Logo" width="140" height="140" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);" />
  <h3>เว็บเบราว์เซอร์ส่วนตัว ความเร็วสูง บล็อกโฆษณาหมดจด พร้อมระบบดึงมีเดียและจัดการทรัพยากรระดับมืออาชีพ</h3>

  <p>
    <b>Bocchy</b> เป็น Custom Web Browser ที่พัฒนาด้วย <b>Electron 34</b> + <b>React 18</b> + <b>TypeScript</b> + <b>Vite</b> + <b>Tailwind CSS</b><br/>
    ใช้ขุมพลัง Chromium ผ่านสถาปัตยกรรมโมเดิร์น <b>WebContentsView</b> ให้ประสิทธิภาพสูงสุด ประหยัดแรม และปรับแต่ง UI ได้ 100% เหมือนเว็บแอปพลิเคชัน
  </p>
</div>

---

## 🌟 จุดเด่นและฟีเจอร์หลัก (Key Features)

### 🛡️ 1. ระบบความปลอดภัยและการป้องกัน (Security & AdShield)
* **Request-Level AdBlocker:** สกัดกั้นโฆษณาและแทร็กเกอร์ตั้งแต่ระดับ Network Request ก่อนส่งออกเครือข่ายจริง (ใช้กฎ EasyList, EasyPrivacy และกฎของ Ghostery) ช่วยประหยัดแบนด์วิดท์และทำให้เว็บโหลดเร็วกว่าเบราว์เซอร์ทั่วไป
* **🚫 บล็อกแบนเนอร์ GIF:** สกัดรูปภาพ `.gif` โฆษณา/เว็บพนันที่มักแทรกในเว็บการ์ตูนและเว็บบอร์ด
* **🛑 ป้องกัน Popups & Redirects:** บล็อกการเด้งเปิดแท็บใหม่และการพาเปลี่ยนหน้าเว็บโดยไม่ได้รับอนุญาต
* **🌐 DNS-over-HTTPS (DoH):** รองรับการเข้ารหัส DNS ผ่าน HTTPS (Cloudflare 1.1.1.1, Google 8.8.8.8, AdGuard DNS, Quad9 9.9.9.9 หรือ Custom URL) ช่วยทะลุการบล็อกเว็บของ ISP และป้องกันการดักฟังข้อมูล
* **🕵️ แท็บไม่ระบุตัวตน (Incognito Tab):** แยก Memory Partition อิสระ ไม่แชร์คุกกี้ แคช หรือประวัติการเข้าชม ลบข้อมูลทิ้งทันทีเมื่อปิดแท็บ

### 🎬 2. ระบบดึงและจัดการมีเดีย (Media Extractor 2.0)
* **ดักจับมีเดียแบบไฮบริด:** ดักจับทั้งจาก Network Response Header (`Content-Type: video/mp4`, `image/webp`, `application/x-mpegURL` HLS Stream) และ DOM Injected Scanner (`srcset`, `data-src`, `<img>`, `<video>`)
* **🎯 จิ้มเลือกส่วนในหน้าเว็บ (Section DOM Picker):** สามารถคลิกไฮไลต์เลือกส่วนของหน้าเว็บ (เช่น ตอนของการ์ตูน หรือโพสต์ใดโพสต์หนึ่ง) เพื่อดึงเฉพาะภาพในส่วนนั้นโดยไม่ติดรูปไอคอนหรือแบนเนอร์อื่น
* **✨ การเลือกรายการอัจฉริยะ:** เลือกทีละรูปได้อย่างอิสระ หรือกด **`Shift + คลิก`** เพื่อเลือกทั้งช่วงพร้อมกัน
* **📦 รวมดาวน์โหลดเป็นไฟล์ .ZIP:** บีบอัดรูปภาพที่เลือกทั้งหมดเป็นไฟล์ `.zip` ไฟล์เดียวด้วย `JSZip` พร้อมแถบแสดง Progress แบบเรียลไทม์

### 📥 3. ระบบดาวน์โหลดแบบเรียลไทม์ (Download Manager & Flyout)
* **Edge/Chrome Style Downloads Flyout:** แผงลอยแสดงประวัติและสถานะการดาวน์โหลดที่มุมขวาบน
* **ดักจับทั้งสองช่องทาง:** ทั้งการดาวน์โหลดปกติผ่านหน้าเว็บ (Electron `will-download` session hook) และการดาวน์โหลดผ่าน Media Extractor
* **สถานะครบครัน:** แถบเปอร์เซ็นต์ความคืบหน้า, ความเร็วในการดาวน์โหลด (KB/s, MB/s), ปุ่มเปิดไฟล์ (Open File), ปุ่มเปิดโฟลเดอร์ (Show in Folder) และปุ่มยกเลิก (Cancel)
* **ไอคอนเคลื่อนไหว:** ปุ่ม 📥 บน Navigation Bar จะกระโดด (Bounce Animation) พร้อม Badge ตัวเลขเมื่อมีรายการกำลังดาวน์โหลด

### ⚡ 4. ประสิทธิภาพและการประหยัดทรัพยากร (Performance & Optimization)
* **💤 โหมดจำศีลแท็บ (Tab Sleep / Memory Saver):** พักการทำงานของแท็บที่ไม่ได้ใช้งานเกินเวลาที่ตั้งไว้ (15, 30, 60 นาที) คืนหน่วยความจำ **ประหยัด RAM ได้ถึง 50-70%** และสามารถปลุกแท็บกลับมาทำงานได้ทันทีเพียงแค่คลิก
* **🎮 สวิตช์เปิด/ปิด Hardware Acceleration (GPU):** สามารถปิด GPU Acceleration เพื่อแก้ปัญหา**จอดำเมื่อสตรีมหรือแชร์จอ Netflix / สตรีมมิ่งใน Discord**

### 🎨 5. หน้าตาและประสบการณ์การใช้งาน (UI/UX)
* **หน้าแรก Speed Dial:** หน้า New Tab สไตล์มินิมอล พร้อมนาฬิกา วันที่ แถบค้นหา (สลับ Google / DuckDuckGo ได้) และทางลัดเว็บโปรด (Bookmarks & Speed Dial)
* **🕒 กู้คืนแท็บที่เผลอปิด (Restore Closed Tab):** กด `Ctrl + Shift + T` หรือเลือกจากรายการในหน้า New Tab เพื่อเปิดแท็บที่เพิ่งปิดกลับมาได้ทันที
* **🌙 โหมดมืดอัจฉริยะ (Force Dark Mode):** ปรับแต่ง CSS Invert อัจฉริยะให้ทุกเว็บไซต์กลายเป็นโหมดมืด โดยไม่ทำให้สีของรูปภาพและวิดีโอเพี้ยน
* **🌐 รองรับ 2 ภาษา:** สลับใช้งานภาษาไทย (TH) และภาษาอังกฤษ (EN) ได้ทันทีจากการตั้งค่า

---

## ⌨️ คีย์ลัดแป้นพิมพ์ (Keyboard Shortcuts)

| คีย์ลัด | การทำงาน |
| :--- | :--- |
| **`Ctrl + T`** | เปิดแท็บใหม่ (New Tab) |
| **`Ctrl + Shift + N`** | เปิดแท็บไม่ระบุตัวตน (New Incognito Tab) |
| **`Ctrl + Shift + T`** | กู้คืนแท็บที่เพิ่งปิดล่าสุด (Restore Closed Tab) |
| **`Ctrl + W`** | ปิดแท็บปัจจุบัน |
| **`Enter` (ในช่อง URL)** | นำทางไปยัง URL หรือค้นหาผ่าน Search Engine |
| **`Shift + คลิก` (ใน Media Extractor)** | เลือกรูปภาพเป็นช่วงตั้งแต่จุดแรกถึงจุดที่คลิก |

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
custom-browser/
├── bocchy.png                 # โลโก้ต้นฉบับความละเอียดสูง (1254x1254)
├── bocchy.ico                 # ไอคอน Windows Multi-Resolution (256x256 ถึง 16x16)
├── release/                   # โฟลเดอร์ผลลัพธ์การ Build Desktop App
│   ├── Bocchy Setup 1.0.0.exe # ตัวติดตั้ง Windows (NSIS Installer)
│   ├── Bocchy-Portable-1.0.0.exe # แอปแบบพกพาไม่ต้องติดตั้ง (Portable)
│   └── win-unpacked/          # ไบนารีพร้อมรัน (Bocchy.exe)
│
├── src/
│   ├── main/                  # 🖥️ Electron Main Process
│   │   ├── index.ts           # Entry point หลัก, ควบคุม Lifecycle, หน้าต่าง, IPC
│   │   ├── viewManager.ts     # จัดการ WebContentsView, แท็บ, Tab Sleep, Force Dark
│   │   ├── adblocker.ts       # ระบบบล็อกโฆษณาและ Tracker (@ghostery/adblocker)
│   │   ├── mediaSniffer.ts    # ระบบดักจับมีเดีย (Network + DOM Picker + ZIP)
│   │   ├── downloadManager.ts # ระบบดาวน์โหลดระดับ Session, ติดตาม Progress & Speed
│   │   └── settingsManager.ts # บันทึกการตั้งค่า (Settings, Bookmarks, DNS, GPU)
│   │
│   ├── preload/               # 🌉 Electron Preload Bridge
│   │   └── index.ts           # ContextBridge exposing window.browserApi ให้ React
│   │
│   ├── renderer/              # ⚛️ React Frontend (UI ทั้งหมด)
│   │   ├── public/
│   │   │   └── bocchy.png     # Asset ไอคอนสำหรับ UI
│   │   ├── src/
│   │   │   ├── App.tsx        # Container หลัก คุม Layout & Event Listeners
│   │   │   ├── components/
│   │   │   │   ├── NavigationBar.tsx   # Omnibar, ปุ่ม Back/Forward, ปุ่มดาวน์โหลด
│   │   │   │   ├── TabBar.tsx          # แถบแท็บ, ไอคอนสถานะหลับ (💤), แท็บไม่ระบุตัวตน
│   │   │   │   ├── NewTabPage.tsx      # หน้าแรกพร้อมโลโก้ Bocchy, นาฬิกา, ทางลัด
│   │   │   │   ├── BookmarksBar.tsx    # แถบทางลัดบุ๊กมาร์กใต้แถบนำทาง
│   │   │   │   ├── MediaDrawer.tsx     # แผงดึงมีเดีย, ตัวกรอง, เลือกช่วง, ดาวน์โหลด ZIP
│   │   │   │   ├── DownloadsFlyout.tsx # แผงลอยสถานะการดาวน์โหลดแบบเรียลไทม์
│   │   │   │   ├── AdShieldModal.tsx   # สถิติและสวิตช์ควบคุม AdShield
│   │   │   │   └── SettingsModal.tsx   # หน้าต่างการตั้งค่าระบบ (ภาษา, DoH, GPU, Memory)
│   │   │   ├── i18n.ts                 # ระบบแปลภาษา (ไทย & อังกฤษ)
│   │   │   ├── main.tsx                # React Root DOM Mount
│   │   │   └── index.css               # สไตล์ Tailwind CSS
│   │   └── index.html         # HTML Template ของ Frontend
│   │
│   └── types/
│       └── browser.ts         # TypeScript Interfaces & Data Contracts
│
├── scripts/
│   ├── dev.mjs                # สคริปต์รัน Vite Dev Server ควบคู่กับ Electron
│   └── build.mjs              # สคริปต์คอมไพล์ TypeScript ด้วย esbuild
├── package.json               # รายการ Dependencies, Scripts และ Config electron-builder
├── tsconfig.json              # การตั้งค่า TypeScript
├── tailwind.config.js         # การตั้งค่า Tailwind CSS
└── vite.config.ts             # การตั้งค่า Vite Bundler
```

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Installation & Development)

### ข้อกำหนดเบื้องต้น (Prerequisites)
- **Node.js**: เวอร์ชัน 18 ขึ้นไป (แนะนำ Node.js 20 หรือ 22)
- **npm**: เวอร์ชัน 9 ขึ้นไป
- **ระบบปฏิบัติการ**: Windows 10 / 11 (64-bit)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันในโหมดพัฒนา (Development Mode)
คำสั่งนี้จะเปิด Vite Dev Server ที่พอร์ต 5173 พร้อมรัน Electron และรองรับ Hot Module Replacement (HMR):
```bash
npm run dev
```

### 3. คอมไพล์โปรเจกต์ (Build)
คอมไพล์โค้ด React Frontend ผ่าน Vite และคอมไพล์ Electron Scripts ผ่าน esbuild:
```bash
npm run build
```

### 4. รันเวอร์ชันหลัง Build (Production Preview)
```bash
npm start
```

---

## 📦 การสร้าง Desktop App Installer (Packaging)

โปรเจกต์นี้ตั้งค่า `electron-builder` สำหรับ Windows ไว้เรียบร้อยแล้ว เพียงรันคำสั่ง:

```bash
npm run package
```

ระบบจะคอมไพล์และสร้างไฟล์ติดตั้งไว้ที่โฟลเดอร์ **`release/`**:

| ชื่อไฟล์ | ขนาด | ประเภท | การใช้งาน |
| :--- | :--- | :--- | :--- |
| **`Bocchy Setup 1.0.0.exe`** | ~87 MB | NSIS Installer | ตัวติดตั้งมาตรฐาน มีขั้นตอนเลือกไดรฟ์ สร้าง Shortcut หน้า Desktop และ Start Menu |
| **`Bocchy-Portable-1.0.0.exe`** | ~86 MB | Portable App | ไฟล์เดียวรันได้ทันทีโดยไม่ต้องติดตั้ง เหมาะสำหรับใส่ Flash Drive |
| **`win-unpacked/Bocchy.exe`** | - | Executable Folder | โฟลเดอร์ไบนารีที่แตกไว้แล้ว สามารถดับเบิ้ลคลิกทดสอบเปิดได้ทันที |

---

## 🛡️ ข้อมูลเชิงลึกด้านความปลอดภัยและความเป็นส่วนตัว (Security Architecture)

1. **สถาปัตยกรรมกระบวนการ (Process Isolation):**
   - หน้าต่าง UI หลักทำงานในสภาพแวดล้อมที่เปิด `contextIsolation: true` และปิด `nodeIntegration: false` อย่างเคร่งครัด
   - การสื่อสารระหว่าง React กับ Electron ทำผ่าน `contextBridge` ใน `src/preload/index.ts` ด้วยช่องทาง IPC ที่ตรวจสอบสิทธิ์อย่างรัดกุม
2. **การแยกเซสชันแท็บไม่ระบุตัวตน (Incognito Isolation):**
   - ทุกครั้งที่เปิดแท็บ Incognito ระบบจะสุ่มสร้าง Partition เฉพาะกิจ เช่น `incognito_1726880000_abcd` ซึ่งแยกแคช คุกกี้ และ LocalStorage ออกจากเบราว์เซอร์หลักโดยสิ้นเชิง
3. **การปกป้องการสืบค้น DNS (DNS-over-HTTPS):**
   - ป้องกันการดักแอบดูชื่อเว็บไซต์ที่เข้าชม (SNI / DNS Spoofing) โดยแปลงคำขอ DNS เป็น HTTPS ไปยังเซิร์ฟเวอร์ที่ปลอดภัย
4. **การจัดการหน่วยความจำ (Memory Saver):**
   - มีระบบตรวจจับ Inactivity Background Polling เพื่อสั่งทำลาย WebContentsView ชั่วคราวเมื่อผู้ใช้ไม่ได้แตะแท็บนั้นเกินเวลา ช่วยป้องกัน Memory Leak จากเว็บที่ใช้สคริปต์หนัก

---

## 📄 ลิขสิทธิ์ (License)

พัฒนาขึ้นเพื่อการใช้งานส่วนตัวและการศึกษา (Custom Private Browser Project)
โลโก้และรูปภาพประกอบเป็นผลงานสร้างสรรค์สำหรับโปรเจกต์ **Bocchy**
