# Changelog

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
