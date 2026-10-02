# Farmer-reference UI repair

## Changes

- Buyer/Admin load `src/farmer-theme.css` after their existing stylesheet. This aligns their navigation, surfaces, spacing, header, typography, controls and KPIs with the Farmer reference while preserving portal-specific pages.
- Farmer desktop sidebar is fixed, with a 260px content offset removed below 769px. Its navigation can scroll internally.
- Admin navigation, cards and action controls use Lucide icons instead of emojis. Decorative status glyphs were removed from Farmer and Buyer copy.
- Admin TransportConfig now handles a successful null API result as first-time setup, leaves fields empty, displays the real save form, rejects blank/non-finite values and offers retry for request failures.
- Backend, auth contexts, API services, deployment configuration and database records were not changed in this repair.

## Verification and limitations

All three frontend production builds passed. JSX emoji scan returned no matches. The transport bug was traced to the existing API's `success: true, data: null` response and the frontend's previous `res.success && res.data` condition.

This is not a claim of complete browser or live database verification. Test a first configuration save with real values using an admin account; also test existing values and a failed network request. No live data was created during this repair.

## Local use

Extract into a new folder. Preserve your original `.git` directory and `.env` files; these are intentionally not included. Run `npm ci` then `npm run dev` in each app folder. The backend needs its existing private environment configuration and localhost CORS origins for local testing.

Before updating your original Git checkout, back it up and copy only the reviewed frontend changes. Do not replace/delete your entire original directory. Test at 320px, 375px, 768px and desktop, including sidebar scrolling, mobile navigation, profile forms and transport setup.
