# T2D Dashboard

**Fintech dashboard that includes TradingView (markets), T2D Pulse (news), CEORater & OpenAI.**

🎥 Demo: https://youtu.be/gGTeoDeLkVM?si=GTiBhbQHDPSjuxZF

---

## What it is
- **Home**: Full TradingView chart (center), **T2D Pulse** feed (right), **CEORater** below the chart.
- **Tabs**: TradingView • T2D Pulse • CEORater • OpenAI
- **PWA**: Installable, offline fallback, and an update prompt when a new version is available.

**Live site**: https://dash.tek2dayholdings.com/

---

## Files
- `index.html` – App shell, tabs, and Home layout
- `service-worker.js` – Caching + update toast
- `manifest.webmanifest` – PWA metadata & icons
- `offline.html` – Offline fallback page
- Icons: `android-chrome-192x192.png`, `android-chrome-512x512.png`, `favicon-*`, `favicon.ico`

---

## Run locally
Use any static server (needed to test the service worker):

- Node: `npx serve -s .`
- Python: `python -m http.server 8080`

Then open the printed localhost URL.

---

## Deploy notes
- Serve the service worker at the site root: `/service-worker.js`
- Set the manifest content type: `application/manifest+json`
- When you release, bump the cache name in `service-worker.js` (e.g., `t2d-dashboard-v5`) so updated assets are used

---

## License
© TEK2day Holdings. All rights reserved.
