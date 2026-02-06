# Changelog

## [0.7.0] - 2026-02-04

### Added
- **Social Preview (og:image)** - Nice preview card when sharing on X/LinkedIn
  - Uses Artemis logo at `/public/og-image.jpg`
  - Twitter card with large image

- **Source Citations Footer**
  - Bitcoin logo with links to Strategy.com and Strive Treasury
  - Small, unobtrusive footer at bottom of page

### Changed
- Updated page title to "BTC Treasury Calculator"
- Enhanced meta description for SEO

---

## [0.6.0] - 2026-02-04

### Added
- **Editable Total Debt/Pref boxes** - Modify $8,214M total directly instead of editing each row
  - `additionalDebt` and `additionalPref` state for adjustments
  - Total rows now have input fields with lavender accent border

### Changed
- **Bigger fonts on calculator tabs**
  - Table fonts increased to `text-base` (16px)
  - Table cell padding increased to `py-4 px-4`
  - Input fields widened to `w-32`
  - Row text uses `font-semibold`

---

## [0.5.0] - 2026-02-04

### Added
- **4-Tab Structure**: Reorganized from 2 tabs to 4 tabs
  - MSTR Calculator (main calculator)
  - Strive Calculator (Strive/ASST calculator)
  - MSTR Sensitivity (sensitivity matrix for MSTR securities)
  - Strive Sensitivity (sensitivity matrix for Strive securities)

- **SensitivityTable Component** (`src/components/SensitivityTable.tsx`)
  - Security dropdown to select any debt or preferred instrument
  - Holdings increment control (configurable, default 100k for MSTR, 5000 for Strive)
  - Dynamic holdings range: current ±3 increments
  - Price steps: $30k, $50k, $75k, $100k, $150k, $200k
  - Color-coded heatmap cells (green ≥10x, yellow 3-5x, orange 2-3x, red <2x)
  - Current cell highlight with ring indicator
  - Cumulative notional display for selected security

- **Artemis Logo** in header (top-left, 40px) using `logo/Purple gradient icon.jpg`

### Changed
- **Dark Lavender Theme** (replaced dark blue)
  - `lavender-bg: #2d2a4a` (main background)
  - `lavender-card: #3d3a5a` (card/input backgrounds)
  - `lavender-border: #4d4a6a` (borders)
  - `lavender-accent: #9d8df1` (accent/highlight color)

- **Typography** - Base font size increased from 14px to 16px
- **Layout** - Max-width container (1200px) with centering, better spacing
- **Tab Styling** - Lavender accent replaces yellow

### Files Modified
- `src/App.tsx` - 4-tab structure, logo, theme
- `src/components/SensitivityTable.tsx` - New component
- `tailwind.config.js` - Lavender color palette
- `src/index.css` - Base font size, typography scaling

---

## [0.4.0] - 2026-02-03

### Added
- **Artemis datasvc integration** for live preferred stock prices
- New `usePreferredPrices` hook fetches STRF, STRC, STRK, STRD, SATA prices
- Serverless function proxy at `/api/datasvc/[...path].ts` with JWT auth
- `npm run dev:vercel` command for local development with serverless functions

### Changed
- Preferred prices now fetched from Artemis datasvc API (60s refresh)
- Strive BTC holdings default updated to reflect actual treasury (~28 BTC)

### Technical
- Added `jose` package for JWT signing
- Environment variable `ARTEMIS_ENCRYPTED_TOKEN_SEED` required for preferred prices

---

## [0.3.0] - 2026-02-03

### Added
- **Strive (ASST) tab** with SATA preferred coverage calculator
- **Actuals vs Assumptions split**: Live data shown separately from editable assumptions
- **Reset button** to restore assumptions to actuals
- **Preferred stock prices** with 1-day change (STRF, STRC, STRK, STRD, SATA)
- USD Reserve now in a styled box above debt table
- Table columns now properly aligned with fixed widths

### Changed
- BTC price and holdings refresh from live API (60s interval)
- Total rows now visually distinct with yellow border
- Strive uses same BTC price as MSTR tab

---

## [0.2.1] - 2026-02-03

### Removed
- STRE from preferred stocks (MSTR doesn't show it)

---

## [0.2.0] - 2026-02-03

### Changed
- **Complete UI redesign** to match coworker's calculator screenshot
- Switched to simple system font (no more hard-to-read monospace)
- Waterfall layout: Debt → Preferred → Totals
- All notional fields are now editable inputs
- Added all 5 preferred stocks: STRF, STRC, STRE, STRK, STRD

### Added
- USD Reserve input field
- Editable debt instruments (Convert 2028, 2030 B, 2029, 2030 A, 2031, 2032)
- Color-coded coverage ratios (green ≥5x, yellow ≥3x, red <3x)
- Cumulative notional column

### Removed
- Complex multi-component UI
- Sensitivity matrix (for now)
- Excessive styling and cards

---

## [0.1.0] - 2026-02-03

### Added
- Initial project setup with Vite + React + TypeScript
- MicroStrategy API integration for live BTC price/holdings
- Artemis API fallback
- Vite proxy for CORS in development
- Vercel serverless functions for production CORS
- Basic debt and preferred tables
