# Agent Bible — Extended Principles

## Vision: "Think Different"
Build tools that make complex financial data accessible. Strategy's BTC treasury model is innovative—our calculator should match their precision while adding flexibility for scenario analysis.

## Default Operating Loop
1. **Plan** — Understand the task, identify edge cases
2. **Implement** — Write minimal, correct code
3. **Test** — Verify against Strategy.com values
4. **Iterate** — Refine based on feedback

## Non-Negotiables

### Code Quality
- TypeScript strict mode, no `any` types
- All financial calculations documented with formulas
- No magic numbers—use named constants
- Error boundaries for graceful failures

### Data Integrity
- Always show data freshness (last updated timestamp)
- Clear loading states
- Fallback to cached data on API failure
- Display "Live" vs "Cached" indicator

### UX Standards
- Mobile-first responsive design
- Keyboard accessible inputs
- Tooltips explain every metric
- No layout shift on data load

## Git Hygiene
- Conventional commits: `feat:`, `fix:`, `refactor:`
- One logical change per commit
- No commented-out code
- No console.logs in production

## Quality Gates
Before any PR:
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] Calculated values match Strategy.com
- [ ] Works on mobile viewport
- [ ] Loading/error states tested

## When Uncertain
1. Check Strategy.com for expected behavior
2. Review MicroStrategy API response structure
3. Look at similar patterns in artemis-dashboard-frontend
4. Ask for clarification before guessing

## Key Formulas

### BTC NAV
```
NAV = BTC Holdings × BTC Price
```

### Coverage Ratio
```
Coverage = NAV / Cumulative Notional
```

### BTC Years of Dividends
```
Years = NAV / Annual Dividend Obligation
```

### BTC Breakeven ARR
```
Breakeven ARR = (Total Debt + Total Pref) / NAV / Avg Duration
```

### BTC Credit Spread
```
Credit = BTC Risk × (1 - 1/Coverage)
```
Where BTC Risk = Volatility × sqrt(Duration)
