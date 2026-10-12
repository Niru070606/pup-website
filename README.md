# PUP Unisan Campus Website

React + TypeScript + Vite + Tailwind frontend, Supabase (PostgreSQL + Auth) backend, hosted on Netlify.
No GitHub needed.

**What it does**
- Public site: Home, About, Academics, Faculty & Staff directory, Announcements (+ detail), Contact.
- Faculty/Staff: register → verify email → admin approval → dashboard. Create drafts, submit for review, see status and rejection reasons, edit profile.
- Administrators: approve registrations, review announcements (approve / request revision / reject), unpublish/archive/republish, manage directory, programs, campus content, settings, contact messages, and read the activity log.
- Security rules live in the database (`supabase/schema.sql`): Row Level Security, least-privilege grants, and server functions for every approval step.

**No official information is invented.** History, vision, mission, contact details, programs and faculty start empty and show "not yet provided" notes until an administrator enters them. There is no logo until you add an authorized one.

---

## 1. Install tools (once)
Install **Node.js 20 or newer** from https://nodejs.org. Then, in this folder:
```
npm install
```

## 2. Create the Supabase project
1. Sign in at https://supabase.com → **New project** (note the database password).
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, click **Run**. Run it **once** on a fresh project.
3. Go to **Authentication → Providers → Email**: keep it enabled, keep **Confirm email ON**, set minimum password length to **10**.
4. Go to **Authentication → URL Configuration**:
   - **Site URL**: your Netlify address (set after step 5; use `http://localhost:5173` for now).
   - **Redirect URLs**: add `http://localhost:5173/**` and later `https://YOUR-SITE.netlify.app/**` (and your custom domain if you have one).
5. **Email delivery:** Supabase's built-in sender allows only a few emails per hour. For real use, add your own SMTP server under **Authentication → SMTP Settings**.
   Do not turn on Captcha under Attack Protection unless you also add Captcha support to the sign-up form (not included).

## 3. Connect the website to Supabase
Copy `.env.example` to `.env` and fill in **Project Settings → API**:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
Use the **anon public** key only. Never use or share the `service_role` key.

## 4. Run locally and create the first administrator
```
npm run dev
```
Open http://localhost:5173 → **Faculty/Staff login → Create account**, register with your email, click the verification link in the email.
Administrators cannot be created from the website. In Supabase **SQL Editor** run (use your email):
```sql
update public.profiles set role = 'admin', status = 'approved' where email = 'you@example.com';
```
Sign in again; you are taken to the Administrator dashboard. Next:
1. **Campus content**: enter only verified history, vision, mission, contact details, optional links, map embed link.
2. **Academic programs** and **Faculty directory**: add verified records.
3. Share the registration page with faculty. Approve them under **Registrations**.

## 5. Deploy to Netlify (no GitHub)
Option A – drag and drop (simplest):
1. Make sure `.env` is filled in (the keys are baked in at build time).
2. `npm run build` (creates the `dist` folder).
3. Go to https://app.netlify.com/drop and drop the **dist** folder.
4. Copy the site address Netlify gives you into Supabase **Site URL** and **Redirect URLs** (step 2.4).
5. To update later: `npm run build` and drag `dist` onto your site's **Deploys** page.

Option B – Netlify CLI:
```
npm install -g netlify-cli
netlify login
netlify deploy --build --prod
```
(First run asks you to create/link a site. Make sure `.env` exists locally.)

`netlify.toml` already sets the SPA redirect (so `/announcements/...` links work on refresh) and security headers (CSP, HSTS, frame protection).

## Roles in one table
| | Visitor | Faculty/Staff | Admin |
|---|---|---|---|
| Read published announcements, directory, programs | ✔ | ✔ | ✔ |
| Draft/submit announcements | – | ✔ (after approval) | ✔ |
| Publish / approve / unpublish | – | never | ✔ |
| Approve accounts, edit content, view logs | – | – | ✔ |

Edits to a live announcement create a new revision; the public keeps seeing the approved version until an admin approves the change.

## Testing checklist
Registration + email verification → still blocked until approved → admin approves → faculty submits → not visible publicly → admin approves → visible, newest first → faculty edits live item → old version stays public until approved → rejection requires reason → suspend user → they lose access → faculty cannot open `/admin` → activity log shows each step → check pages on a phone and with keyboard only.

## Known limits (not implemented)
- Announcement file attachments (spec says "when supported"); text only.
- Captcha on registration/contact (Supabase rate limits apply; contact form has a honeypot field).
- Admin accounts are created/changed only via SQL (by design).
- Users cannot change their own email in the app.
- Backups: use Supabase's backup features for your plan.
