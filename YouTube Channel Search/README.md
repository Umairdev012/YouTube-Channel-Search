# 📺 TubeFinder

> **Search, explore & analyze any YouTube channel instantly.**  
> Powered by YouTube Data API v3 — no backend required.

![Version](https://img.shields.io/badge/version-1.0.0-ff0000?style=flat-square)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![YouTube API](https://img.shields.io/badge/YouTube_API_v3-FF0000?style=flat-square&logo=youtube&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔍 Smart Search | Channel suggestions dropdown as you type |
| 📊 Full Analytics | Subscribers, views, uploads, engagement rate |
| 🎬 Video Explorer | Latest & top videos with stats |
| 📈 Charts | Bar, Doughnut & Line charts via Chart.js |
| ⚖️ Compare Mode | Side-by-side channel comparison |
| 🎭 Skeleton UI | YouTube-style shimmer loading |
| 🌙 Dark / Light | YouTube dark theme by default |
| 💾 History | Last 10 searched channels saved locally |

---

## 🚀 Getting Started

### 1. Get a YouTube API Key
```
Google Cloud Console → APIs & Services → Credentials → Create API Key
Enable: YouTube Data API v3
```

### 2. Clone & Open
```bash
git clone https://github.com/yourusername/youtube-channel-search.git
cd youtube-channel-search
open index.html
```

### 3. Enter API Key
```
On first load → Enter your API key in the setup modal → Save
```

> ✅ No installation, no npm, no server — runs directly in browser.

---

## 📁 Project Structure

```
youtube-channel-search/
├── index.html          # Main app — all screens
├── css/
│   ├── style.css       # Dark/Light theme + all styles
│   └── responsive.css  # Mobile & tablet breakpoints
├── js/
│   ├── app.js          # State, theme, history, toasts
│   ├── api.js          # All YouTube API calls
│   ├── channel.js      # Profile, stats, compare logic
│   ├── videos.js       # Video grid, charts, playlists
│   └── ui.js           # Screens, tabs, skeleton, errors
└── README.md
```

---

## 📊 Tabs Overview

| Tab | Content |
|-----|---------|
| 🎬 Videos | 12 latest videos, sortable, load more |
| ℹ️ About | Description, keywords, links, country |
| 📋 Playlists | Channel playlists grid |
| 📈 Stats | Charts + upload frequency + engagement |
| 🏆 Top Videos | Top 10 most viewed with 🥇🥈🥉 medals |

---

## ⚖️ Compare Mode

Search two channels → instant side-by-side comparison:

```
| Metric           | Channel A  | Channel B  |
|------------------|------------|------------|
| Subscribers      |   1.2M ✅  |   890K     |
| Total Videos     |   450      |   230      |
| Avg Views/Video  |   111K ✅  |   100K     |
| Upload Freq/Mo   |   4.7 ✅   |   3.2      |
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search input |
| `Escape` | Close dropdown / modal |

---

## ⚠️ API Quota Note

YouTube Data API v3 allows **10,000 units/day** (free).  
App shows quota warning automatically when limit is reached.

---

## 🛠️ Built With

- **Vanilla JavaScript** + **jQuery** (AJAX only)
- **Chart.js** — Bar, Doughnut & Line charts
- **YouTube Data API v3**
- **Font Awesome 6** — Icons
- **Google Fonts** — Inter, Poppins

---

## 🙌 Author

**Mirza Umair**  
Frontend & WordPress Developer  
📧 umairmcs100@gmail.com  
🔗 [LinkedIn](https://linkedin.com/in/umairdev012) · [Portfolio](https://umairdev.site)

---

## 📄 License

MIT License — free to use, modify & distribute.

---

<p align="center">Made with ❤️ using YouTube Data API v3</p>
