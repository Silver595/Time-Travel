# 🧭 Time Travel for Web

> Compare any website's past with its present — side by side.

A Chrome Extension (Manifest V3) that fetches a website's historical snapshot from the **Wayback Machine** and displays it alongside the live version in a split-screen view.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ogckpcboinbcohhilmofkalobpkolkib?label=Chrome%20Web%20Store&logo=googlechrome&logoColor=white&color=4285F4)](https://chromewebstore.google.com/detail/time-travel-for-web/ogckpcboinbcohhilmofkalobpkolkib)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/ogckpcboinbcohhilmofkalobpkolkib?label=Users&logo=googlechrome&logoColor=white&color=34A853)](https://chromewebstore.google.com/detail/time-travel-for-web/ogckpcboinbcohhilmofkalobpkolkib)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/ogckpcboinbcohhilmofkalobpkolkib?label=Rating&logo=googlechrome&logoColor=white&color=FBBC05)](https://chromewebstore.google.com/detail/time-travel-for-web/ogckpcboinbcohhilmofkalobpkolkib)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## ✨ Features

- 🔍 **Instant Snapshot Search** — Single API call to the Wayback Machine with CDX API fallback
- 🖥️ **Split-Screen Comparison** — View archived and live versions side by side
- 📅 **Date Picker** — Choose any past date to find the closest snapshot
- ↔️ **Layout Toggle** — Switch between horizontal and vertical layouts
- 👁️ **Panel Toggle** — Show/hide live or archive panels independently
- ⌨️ **Keyboard Shortcuts** — `Alt+H` (horizontal), `Alt+V` (vertical), `Alt+L` (toggle live), `Alt+A` (toggle archive)
- 🔓 **Header Bypass** — Strips `X-Frame-Options` and CSP headers so most sites load inside iframes
- 💾 **Persistent Preferences** — Remembers your last date pick and layout choice

---

## 🛠️ Installation

### ⭐ From Chrome Web Store (Recommended)

Install directly from the Chrome Web Store with one click:

<p align="center">
  <a href="https://chromewebstore.google.com/detail/time-travel-for-web/ogckpcboinbcohhilmofkalobpkolkib">
    <img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" alt="Available in the Chrome Web Store" width="248" />
  </a>
</p>

### 🔧 From Source (Developer Mode)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Silver595/Time-Travel.git
   ```

2. **Open Chrome Extensions:**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top-right toggle)

3. **Load the extension:**
   - Click **"Load unpacked"**
   - Select the `Time-Travel` folder

4. **Pin the extension** to your toolbar for quick access.

---

## 🚀 Usage

1. Navigate to any website you want to compare.
2. Click the **🧭 Time Travel** icon in your toolbar.
3. Optionally select a **past date** using the date picker.
4. Click **🔍 Compare**.
5. A new tab opens with the **archive snapshot** (left) and **live site** (right) side by side.

---

## 📁 Project Structure

```
Time-Travel/
├── manifest.json            # Extension configuration (MV3)
├── popup.html               # Extension popup UI
├── popup.js                 # Popup logic — Wayback API calls
├── splitscreen.html         # Split-screen comparison page
├── splitscreen-script.js    # Split-screen logic — iframes, layout, header bypass
├── styles.css               # Custom layout styles
├── tailwind.min.css         # Bundled TailwindCSS (local, no CDN)
├── icon16.png               # Extension icons
├── icon48.png
├── icon128.png
└── SECURITY_REPORT.md       # Detailed security audit & changelog
```

---

## 🔐 Permissions Explained

| Permission | Why It's Needed |
|---|---|
| `activeTab` | Get the URL of the tab you're currently viewing |
| `tabs` | Query tab information and open the split-screen view |
| `storage` | Save your date picker selection and layout preference |
| `declarativeNetRequest` | Strip `X-Frame-Options` / CSP headers so live sites load in iframes |
| `<all_urls>` (host) | Required by `declarativeNetRequest` to modify response headers for any site |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + H` | Switch to horizontal layout |
| `Alt + V` | Switch to vertical layout |
| `Alt + L` | Toggle live site panel |
| `Alt + A` | Toggle archive panel |

---

## 🏗️ Technical Architecture

```
┌──────────────┐      Wayback API       ┌─────────────────┐
│   popup.js   │ ──────────────────────► │   archive.org   │
│  (user click)│ ◄────────────────────── │  (availability  │
└──────┬───────┘    closest snapshot     │   + CDX APIs)   │
       │                                 └─────────────────┘
       │ opens new tab
       ▼
┌──────────────────────────────────────────────────┐
│              splitscreen.html                     │
│  ┌────────────────────┬────────────────────┐      │
│  │   Archive iframe   │    Live iframe     │      │
│  │  (web.archive.org) │  (original site)   │      │
│  └────────────────────┴────────────────────┘      │
│  declarativeNetRequest strips X-Frame-Options     │
│  from responses (scoped to this tab only)         │
└──────────────────────────────────────────────────┘
```

---

## 📜 Changelog

### v1.7 (Current)
- 🔒 Security hardened — URL validation, CSP, bundled Tailwind, no content scripts
- ⚡ Performance — Single API call instead of 31 sequential requests
- 🔓 Header bypass — `declarativeNetRequest` session rules strip iframe blockers
- 🧹 Removed unused `content.js`

### v1.5 (Initial)
- Basic Wayback Machine integration
- Split-screen comparison view

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 🛡️ Privacy

Your privacy matters. This extension:

- ✅ Does **not** collect or sell any user data
- ✅ Does **not** track your browsing activity
- ✅ Does **not** transfer data for purposes unrelated to core functionality
- ✅ Does **not** use data for creditworthiness or lending purposes

Read the full [Privacy Policy](https://docs.google.com/document/d/1ddFlmfQ250Mtlkv7PTw2pdAFtEMn32VzxHYe-NkoWrk/edit?usp=sharing).

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

**Made with ❤️ by [Silver595](https://github.com/Silver595)**
