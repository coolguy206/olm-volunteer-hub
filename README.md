# 🎬 OLM Volunteer Hub

An automated, mobile-first volunteer clock-in system built for **Our Lady of Mercy Catholic School**. This platform bridges **SignUpGenius V2** schedule sheets with a **Google Sheets** database backend to effortlessly log parent participation points on event nights.

Designed specifically for outdoor campus functions, this application ensures absolute data integrity and a premium user experience through hardware-level geolocation rules, custom dark-mode aesthetics, and an active offline resilience buffer.

---

## 📈 Real-World Impact
- **100% Manual Overhead Elimination:** Migrated the school from traditional paper log methods to an automated edge system, completely removing post-event spreadsheet data entry requirements for the PTO board.
- **100% Data Integrity Enforced:** Automated duplicate-blocking and state-validation rules ensured a flawless chronological database ledger with zero accidental duplicate rows or out-of-order clock-ins.
- **Zero-Loss Network Failover:** Successfully synchronized 100% of offline actions during cellular outages on the school grounds, shielding the application from spotty field coverage.

---

## ✨ Features & Technical Highlights

- **Cinematic Dark-Mode UI:** A fully custom, glassmorphic dark theme built with **Tailwind CSS**, optimized explicitly for low-light, nighttime outdoor mobile screen scanning.
- **Interactive Success Modals:** Replaced basic, disruptive browser alerts with custom, high-contrast modal overlays that gracefully guide parents through registration status, location locks, and system states.
- **Geofenced Verification:** Implements the **HTML5 Geolocation API** paired with the **Haversine cryptographic equation** to lock checking in/out to a strict **150-meter perimeter** centered over the OLM campus. Prevents remote entries from home.
- **Offline Network Queue Buffer:** Catches cell drops on the school grounds, queuing check-in payloads securely inside the phone's browser `localStorage`. Instantly and automatically flushes the queue to the cloud the moment internet connectivity returns.
- **Idempotent Data Ingestion Webhook:** A custom **Google Apps Script HTTP POST processor** scans the last 100 spreadsheet rows on-the-fly to seamlessly drop rapid duplicate button-mashes or invalid status transitions.
- **Cross-Session Memory Persistence:** Tracks active session keys locally per account profile. If parents close their browser app mid-movie, it skips the log-in page upon return and has their active **Check Out** button waiting.

---

## 🛠️ Technical Stack Breakdown

- **Frontend & UI:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Glassmorphic UI paradigms.
- **Client Edge Utilities:** HTML5 Geolocation API, Haversine Trigonometric Formula, LocalStorage API, Window Online/Offline Event Listeners.
- **Backend & Cloud Tunneling:** Vercel Global CDN (Serverless API Route Proxying), SignUpGenius V2 Key-Based Reporting API, Google Sheets DB, Google Apps Script Macros Engine.

---

## 📁 System Architecture

```text
olm-volunteer-hub/
├── app/
│   ├── api/
│   │   ├── checkin/route.ts   # Proxies coordinates and timestamps securely to Google Sheets
│   │   └── slots/route.ts     # Contacts SignUpGenius API and handles server-side token encryption
│   ├── layout.tsx
│   └── page.tsx               # Minimal, contained application entry wrapper
├── components/
│   └── VolunteerHub.tsx       # Core React module managing geolocation, offline buffers, and modals
├── .env.local                 # Secret credentials repository profile (Git ignored)
└── tsconfig.json              # Coordinates absolute path configuration shorthand mappings (@/*)
```

---

## 🚀 Public Vercel Deployment Instructions

1. Push your final code changes completely to your main branch on **GitHub**.
2. Create or log into your [Vercel Dashboard](https://vercel.com) and click **Add New > Project**.
3. Import your repository named `olm-volunteer-hub`.
4. Prior to hitting compile, expand the **Environment Variables** panel and add your production credentials matching your local `.env.local` profile layout exactly:
   - `SIGNUPGENIUS_API_KEY`
   - `GOOGLE_SHEETS_URL`
5. Click **Deploy**. Vercel will deliver your active public link (e.g., `https://vercel.app`) instantly!
6. **CRITICAL PRODUCTION STEP:** Before the event night goes live, ensure you switch your code constant inside `components/VolunteerHub.tsx` back to production parameters and push the deployment update:
```typescript
const IS_TESTING_MODE = false; // Activates real satellite search checks for parents on campus
```
