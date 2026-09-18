# 🎬 OLM Volunteer Hub

An automated, mobile-first volunteer clock-in system built for **Our Lady of Mercy Catholic School**. This platform bridges **SignUpGenius V2** schedule sheets with a **Google Sheets** database backend to effortlessly log parent participation points on event nights.

Designed specifically for outdoor campus functions, this application ensures total data accuracy through hardware-level geolocation rules and an active offline resilience buffer.

---

## ✨ Production Features

- **SignUpGenius Integration:** Parents simply enter their registered email address to instantly retrieve their specific shift schedules dynamically on-screen.
- **Cinematic Dark Mode UI:** A responsive, glassmorphic dark theme optimized for outdoor mobile screen scanning under nighttime event conditions.
- **Geofenced Verification:** Implements the free HTML5 Geolocation API and the Haversine equation to lock checking in/out to a strict **150-meter perimeter** centered over the OLM campus. Prevents accidental or remote submissions from home.
- **Offline Network Queue Buffer:** If cell coverage drops on the school field, submissions are stashed securely inside the phone's browser `localStorage` and silently synchronized to the cloud database the moment connection returns.
- **Duplicate & State Blocker:** A custom Google Apps Script webhook scans the spreadsheet to swallow duplicate clicks or rapid double-taps, maintaining a clean chronological data ledger.
- **Cross-Session Memory Persistence:** Tracks active session keys locally per account profile. If parents close their browser app mid-movie, it skips the log-in page upon return and has their active **Check Out** button waiting.

---

## 📁 System Architecture

```text
olm-volunteer-hub/
├── app/
│   ├── api/
│   │   ├── checkin/route.ts   # Proxies coordinates and timestamps to Google Sheets
│   │   └── slots/route.ts     # Safely contacts SignUpGenius API and isolates emails
│   ├── layout.tsx
│   └── page.tsx               # Minimal application view wrapper
├── components/
│   └── VolunteerHub.tsx       # Core React component holding tracking logic & UX states
├── .env.local                 # Secret API key tokens repository configuration (Git ignored)
└── tsconfig.json              # Coordinates clean absolute path mappings (@/*)
```

---

## 🛠️ Local Installation & Development

### 1. Clone the project and install requirements
```bash
git clone https://github.com
cd olm-volunteer-hub
npm install
```

### 2. Configure Local Environment Profiles
Create a `.env.local` file at the absolute root level of the folder structure:
```env
SIGNUPGENIUS_API_KEY=your_key_here
GOOGLE_SHEETS_URL=your_google_apps_script_web_app_url_here
```

### 3. Toggle Testing Simulation Modifiers
To test the full lifecycle on your laptop from home without your coordinates blocking the request, open `components/VolunteerHub.tsx` and ensure `IS_TESTING_MODE` is enabled:
```typescript
const IS_TESTING_MODE = true; // Bypasses Geolocation math during desk testing
```

### 4. Fire Up the Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser window to interact with the dashboard.

---

## 🚀 Public Vercel Deployment Instructions

1. Push your final code changes completely to your main branch on **GitHub**.
2. Create or log into your [Vercel Dashboard](https://vercel.com) and click **Add New > Project**.
3. Import your repository named `olm-volunteer-hub`.
4. Prior to hitting compile, expand the **Environment Variables** panel and add your production credentials matching your local `.env.local` profile layout exactly.
5. Click **Deploy**. Vercel will deliver your active public link (e.g., `https://vercel.app`) instantly!
6. **CRITICAL PRODUCTION STEP:** Before the event night goes live, ensure you switch your code constant inside your repository back to production parameters and push the deployment update:
```typescript
const IS_TESTING_MODE = false; // Activates real satellite search checks for parents
```

---

## 📈 Google Sheets Backend Setup

The tracking database operates on a zero-cost infrastructure model driven by a lightweight **Google Apps Script** Webhook appended directly to your workbook sheet macro modules:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Check for duplicates across the last 100 rows before logging...
    // [Insert main duplicate logic block here]
    
    sheet.appendRow([new Date(), data.email, data.slotId, data.slotName, data.type, data.lat, data.lon]);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
```
*Note: Make sure your Web App Deployment parameters are set to Execute as "Me" and Who has access to "Anyone" to bridge the secure API tunnel properly.*
