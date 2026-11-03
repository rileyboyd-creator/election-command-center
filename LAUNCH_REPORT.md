# Public launch polish — November 3, 2026

## Completed
- Removed standalone Control navigation and duplicate route; Senate calculator and House totals/maps remain.
- Scenario eligibility excludes provider calls, official statuses, and explicitly verified uncontested ballots. Safe ratings, single-name rosters without verified ballot evidence, and independents are not silently excluded. No new verified-uncontested ballot records were invented. There was no existing House hypothetical calculator; House seat calculations remain intact.
- Added individually sourced Crystal Ball tags for AK/MI (Lean D), IA/SC/LA (Lean R), dated November 2. All other classifications remain Unrated. Source: https://sabatoscrystalball.substack.com/p/the-final-2026-ratings-democrats . Tags never change results or calls. A full commercial rating table was not copied.
- Added Open Graph/Twitter metadata, canonical URL, favicon, and a rendered 1200×630 PNG social preview under assets/.
- Added optional Fuel the Command Center footer link and About/Sources section with Riley Boyd credit. Verified https://buymeacoffee.com/rileyboyd opens the Riley Boyd support page; no payment was submitted.
- Added local state favorites and navigation shortcuts. Browser reload preserves choices; no account/backend/telemetry added.
- Freshness now distinguishes Last checked from provider Last updated, with date and Mountain time. Awaiting zero-vote results no longer triggers an alarming stale banner. Failed checks preserve results and are timestamped.
- Responsive spacing, scroll-contained tables, readable form controls, and deferred full-page refresh while editing. Failed local-storage writes no longer reject otherwise valid live results.
- Snapshot/history requests allow HTTP cache revalidation instead of forcing full unchanged downloads.

## Validation
- Existing insights and refresh-health tests pass; added launch tests cover scenario filtering, safe/independent retention, seat sums, reset, rating provenance, required metadata and PNG dimensions.
- Chrome same-origin iframe layouts checked at 375, 390, 430, 768, 1280 and 1920 CSS px: overview, Senate, House, State by State, Reporting, Sources, Ladder and County Maps. No page-level horizontal overflow in measured layouts. Wider tables remain internally scrollable. This is responsive Chrome testing, not native iOS/Android device certification.
- Browser-verified Senate Texas hypothetical adds one Democratic seat and removes one unresolved seat; Reset restores 34 D / 31 R / 35 unresolved with the current baseline.
- Browser-verified favorite Idaho, reload, and persisted Following state. Verified support destination. Existing county click/focus/keyboard handlers retained.
- Local JSON parsed successfully. No authentication or paid service introduced; automated refresh workflow unchanged. Repository contents approximately 4.44 MB at audit; largest history file approximately 714 KB. Direct provider requests remain the main per-viewer bandwidth cost. Conditional requests improve GitHub fallback efficiency.

## Limits / deferred
- Native iPhone Safari and Android Chrome not available for device testing. Charts have no real nonzero reporting history to visually assess yet. Loading and outage layouts remain functional.
- Rating coverage intentionally limited to five explicit classifications; no unsupported Safe tags or guessed race calls.
- All-state turnout, broader county historical baselines, AP and DDHQ remain unconnected as before. No new turnout figures inferred from race returns.
- civicAPI remains the primary live results provider; no-vote and older provider timestamps are preserved. NC independent feed remains separate. A working connection does not guarantee accurate or fresh upstream data.
- Social crawler cache refresh timing is outside the application; public metadata/image endpoints must be checked after deployment.

## Release / rollback
Changes prepared on public-launch-polish. Merge PR only after CI passes; deploy with the existing GitHub Pages workflow and verify the public URL. Previous source is preserved at the parent of the launch commit. Revert only launch source/assets changes for rollback; preserve ongoing data commits.

Live URL: https://rileyboyd-creator.github.io/election-command-center/
