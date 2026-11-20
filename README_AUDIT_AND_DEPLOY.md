# Khayyan Memorial Portal v2 — Audit report + Deploy guide

## 0. SABSE PEHLE (aaj hi, code deploy karne se bhi pehle)

Purane `backend` repo mein **asli secrets seedha code mein likhe hue the** (`server.js` aur `routes/*.js`) aur wo git history mein commit ho chuke hain. Repo GitHub par hai, is liye unhein **leak maan kar rotate karein**:

1. **MongoDB Atlas** → Database Access → us user ka password badlein (ya naya user banayein, purana delete karein). Network Access mein sirf zaroorat ki IPs rakhein (Vercel ke liye `0.0.0.0/0` chal jata hai, par password mazboot hona chahiye).
2. **Cloudinary** → Settings → API Keys → API Secret regenerate karein.
3. Naye values sirf **Vercel Environment Variables** mein rakhein, code ya git mein kabhi nahi.
4. Behtar ho ga ke repo private kar dein. History saaf karna (git filter-repo) optional hai — rotate karne ke baad purane secrets bekaar ho jate hain.

## 1. Audit — kya kya mila

| # | Khatra | Kahan | Asar |
|---|--------|-------|------|
| 1 | **Mongo URI (password ke saath) code mein hardcoded** | backend/server.js | Koi bhi poora database parh/likh/delete kar sakta tha |
| 2 | **Cloudinary API secret hardcoded** (2 files) | backend/routes/* | Koi bhi aap ke account mein upload/delete kar sakta tha |
| 3 | **Backend par koi authentication hi nahi** | add/update/delete/stats routes | Browser mein URL se ya curl se **koi bhi** records delete/badal sakta tha |
| 4 | Admin login sirf frontend mein: `admin` / `admin123` | AdminLogin.jsx | Password har visitor ke browser ko bheja ja raha tha |
| 5 | `/admin/dashboard` page par koi guard nahi (`isAdmin` flag kabhi check nahi hota) | App.jsx | URL kholo, dashboard khul jata tha |
| 6 | `localStorage.isAdmin = 'true'` se Directory par Edit/Delete buttons | Directory.jsx | DevTools mein ek line se admin ban sakte the |
| 7 | CORS `origin: "*"` | server.js | Har website API ko call kar sakti thi |
| 8 | Koi input validation nahi (sab kuch seedha `req.body` se DB mein) | routes | NoSQL-injection / ghalat data / bohat lamba data |
| 9 | `error.message` client ko wapas bheja ja raha tha | routes | DB ki andar ki details leak |
| 10 | File upload par koi size/type limit nahi | multer | Kisi bhi qism ki bari file se storage bhar sakti thi |
| 11 | Purana `multer@1.4.5-lts.1` (known vulnerabilities) | backend package.json | Upgrade kiya (2.x) |
| 12 | Server-side libraries (`cloudinary`, `multer`, `multer-storage-cloudinary`) **frontend** ke package.json mein | frontend | Bekaar bundle bloat, confusion |
| 13 | Delete par Cloudinary se tasveer nahi hat'ti thi (UI keh raha tha hat jayegi) | routes | Storage zaya, purani photos online reh jati thin |
| 14 | `dayOfWeek` client se aata tha, server bharosa karta tha | routes | Ghalat din save ho sakta tha |
| 15 | Announcement update mein badge logic ka bug ("Soyem / Qul" ka colour kho jata tha); Tailwind classes DB mein save | announcements.js | Presentation DB mein, bug |
| 16 | `/all` har baar **poora** database bhejta tha (Home sirf ginti ke liye bhi) | routes + Home | Records barhne par slow |

### Fazool / adhoora / kaam na karne wala — saaf kiya
- `backend/uploads/` (29 purani local files, git mein commit) — ab Cloudinary use hota hai, ye bekaar thi. **Repo se delete karein** (`git rm -r uploads`).
- Vite template ka bacha hua code: `App.css`, `assets/react.svg`, `vite.svg`, `hero.png`, `public/icons.svg`, Vite wala **purple favicon**.
- Dead config: `tailwind.config.js` aur `postcss.config.js` (Tailwind v4 + `@tailwindcss/vite` mein inka koi kaam nahi), `public/husnain.png` (duplicate), PWA mein maujood na hone wali files ki list.
- Home par **Unsplash ke random jungle/pahar ki tasveerein** (gaoon se koi talluq nahi) aur auto-slider — hata kar asli gaoon ki photo lagayi.
- Home par **jaali numbers** (`+92 300 1234567`, `7654321`...) aur toota hua Google Maps link (`.../...`). Ab ye Admin → Settings se aap asli numbers/link daalein; jab tak khali hon, ye hissa nazar nahi aata.
- `alert()` popups, DOM se image chhupane wale hacks, Home mein bekaar `useEffect`/state.

## 2. Naya kya hai

**Security**
- Sirf **ek admin**: email `ADMIN_EMAIL` env variable se tay hota hai (code ya DB mein nahi). Register/sign-up ka koi route hai hi nahi.
- Password **bcrypt hash** (`ADMIN_PASSWORD_HASH`) se verify hota hai; login par 8 ghante ka signed JWT (HS256, issuer/audience pinned). Har admin request par email dobara env se match hoti hai.
- Har write route (`POST/PUT/DELETE`), `/api/admin/*`, settings update — sab `requireAdmin` ke peeche. Bina token ya ghalat token = 401.
- Login brute-force protection: ek IP se 5 ghalat koshishon ke baad 15 minute ka lock (MongoDB mein, serverless par bhi kaam karta hai) + timing-safe check (ghalat email par bhi bcrypt chalta hai).
- zod validation har input par (sirf strings, lengths, enum, asli tareekh, future ki tareekh nahi), ObjectId check, server par `dayOfWeek`.
- CORS sirf `ALLOWED_ORIGINS`; helmet headers; JSON body 50KB limit; rate limit; upload sirf JPG/PNG/WebP aur MP3/M4A/WAV/OGG, 4MB tak; error par generic message.
- Server config adhoori ho to **fail-closed** (503), bina auth ke nahi chalta.
- Activity log: har login (kamyab/nakaam), add/edit/delete, export — 180 din tak.

**Admin Portal (screenshot wale Lumière style mein: plum sidebar, cream cards, alert strips, charts)**
- Overview: alert strips (tasveer baqi, elaan jald expire), 4 stat cards, saal-ba-saal chart, wand donut chart, haal hi ke records, sargarmi.
- Marhoomein: search, wand filter, sort, "sirf bina tasveer" filter, pagination, add/edit/delete modal (photo preview, photo hatana), **duplicate warning**, **CSV backup** download.
- Khabarnama: add/edit/delete, image + voice note, ghante-baqi counter, purani media Cloudinary se bhi hat'ti hai.
- Settings: counters, **zaroori numbers editor**, map link.
- Activity Log.
- Sab jagah loading skeletons, error states with retry, empty states, toasts, confirm dialogs, mobile drawer.

**Public site**
- Naya Home: hero + search + wand shortcuts + asli gaoon ki photo, stats, khabarnama cards, contacts, map, team, ayat.
- Directory: server-side search (debounce), wand chips, sort, "Mazeed dekhein", **WhatsApp share / link copy** (`/directory?id=...` seedha us record par kholta hai). Edit/Delete buttons public page se hata diye.
- Ek hi plum + cream + gold palette poori app mein, mobile responsive, accessible modals (Esc, aria).

## 3. Deploy karne ke steps

### Backend (Vercel project: khayyan-portal-backend)
1. Repo ki purani files hata kar `backend/` ka naya content rakhein (`uploads/` folder **mat** rakhein). `.gitignore` mein `.env` hai.
2. Local par: `cd backend && npm install && npm run hash-password` → password do (kam az kam 12 harf) → ye `ADMIN_PASSWORD_HASH` aur `JWT_SECRET` print karega.
3. Vercel → Project → Settings → Environment Variables mein ye sab daalein (`.env.example` dekhein):
   `MONGO_URI` (naya password), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (**quotes ke baghair paste**), `JWT_SECRET`, `ALLOWED_ORIGINS` (aap ka frontend URL, comma se alag), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (naya).
4. Deploy karein. Check: `https://<backend>/` par `{"ok":true,...}` aaye; `https://<backend>/api/admin/overview` bina login **401** de.

### Frontend (Vercel project: khayyan-portal frontend)
1. Naya `frontend/` content rakhein, `npm install`.
2. Agar backend ka URL badla ho to Vercel env `VITE_API_URL` set karein (warna purana `khayyan-portal-backend.vercel.app` default hai).
3. Deploy. `/admin` par `ADMIN_EMAIL` + apne naye password se login karein.

### Pehli baar login ke baad
- Admin → Settings mein **asli numbers aur map link** daalein.
- `ALLOWED_ORIGINS` mein frontend ka custom domain bhi ho to wo bhi shamil karein.

## 4. Jo aap ko pata hona chahiye
- **Maine ye code yahan `npm install` ya Vercel par chala kar test nahi kiya** (is environment mein network nahi). Frontend ka poora bundle esbuild se compile hua, pages ka render test hua, backend ki sab files ka syntax check aur utility logic test hua. Lekin pehli real deploy par ek baar sab flows khud check karein: login → record add (photo ke saath) → edit → delete → khabarnama (audio ke saath) → CSV export.
- **Khabarnama 24 ghante baad khud hat jata hai** (ye purane code ka TTL index tha, maine rakha hai). Agar ye ghalti se tha to batayein, badal denge.
- Vercel body limit ~4.5MB hai, is liye tasveer + audio mila kar 4MB se kam rakhein (UI mein likha hua hai). Bari audio files ke liye agla qadam Cloudinary par seedhi (signed) upload hai.
- iPhone ki HEIC tasveerein upload nahi hongi (JPG/PNG/WebP chahiye).
- Purani records mein `imageName: "cover.jpg"` wale ko "bina tasveer" gina jata hai.
- Admin session tab band karne par khatam ho jata hai (`sessionStorage`), 8 ghante ke baad bhi.
- Purani API paths badal gayi hain (`/api/marhoomein/add` → `POST /api/marhoomein`, `/all` → `GET /api/marhoomein`, stats → `/api/settings`). Frontend aur backend **ek saath** deploy karein, warna purana frontend nayi backend se kaam nahi karega.
