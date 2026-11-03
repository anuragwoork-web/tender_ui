# Tender UI

Vue 3 + Vite + Tailwind dashboard for the Tender Aggregator. Tenders browse karne, filter/search, bookmark, scrape logs dekhne, aur portals manage karne ke liye.

## Backend

Ye UI **Tender backend** ko call karta hai (`../Tender/`), jo local pe **port 8001** pe chalta hai.

> Port note: `bid_managment` backend `8000` use karta hai, isliye Tender backend `8001` pe rakha gaya hai taaki dono saath chal sakein.

API URL `.env` se aata hai:

```
VITE_API_URL=http://localhost:8001
```

Network/LAN IP se access karna ho to: `VITE_API_URL=http://192.168.1.9:8001`

> **`.env` change karne ke baad Vite dev server restart karna zaroori hai** — warna purana URL cached reh jaata hai.

## Setup

```bash
npm install
cp .env.example .env     # phir VITE_API_URL set karo (default 8001)
```

## Run

```bash
npm run dev      # dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # build ko locally serve karo
```

## Pages

- **Dashboard** — summary stats (`/stats`)
- **Tenders** — paginated list + filters (`/tenders`). Table view default, Cards toggle.
- **Tender Detail** — single tender (`/tenders/{id}`)
- **Bookmarks** — saved tenders
- **Logs** — scrape run history (`/logs`)
- **Portals** — configured portals (`/portals`)

## Stack

Vue 3 (`<script setup>`) · Vite · Tailwind CSS · Vue Router

## Local: Collector v1 data dekhna (SQLite)

UI ab backend ke `/v1/*` endpoints padhta hai (collector ke `tc_*` tables).
Laptop par default database SQLite hai: `tender/data/tenders_v1.db`.

1. Backend (scheduler band, taaki koi sweep apne aap na chale):

   ```sh
   cd ../tender
   SCHEDULER_ENABLED=0 python -m uvicorn app:app --host 127.0.0.1 --port 8003
   ```

   PowerShell: `$env:SCHEDULER_ENABLED="0"; python -m uvicorn app:app --host 127.0.0.1 --port 8003`

2. UI: `.env` mein `VITE_API_URL=http://localhost:8003`, phir `npm install` aur `npm run dev` → http://localhost:5173

MySQL par jaana ho to sirf backend ke `.env` mein `DB_URL=mysql+pymysql://...` — UI mein kuch nahi badalta.

Pages: Dashboard (counts, detail coverage), Tenders (portal/state/status/detail filters, search by
tender ID), Tender detail (dates, EMD/fee/value, documents, corrigenda, change history, saare portal
fields), Collector Runs (har sweep: listed/expected, new/changed/gone, details), Portals (42 portals,
IREPS OTP login, manual trigger).
