# Election-night upgrade record

## Existing application

Buildless HTML + JavaScript modules. GitHub Pages publishes main at https://rileyboyd-creator.github.io/election-command-center/ . No framework or package install required. Existing public Election 2026 design, Senate/House scoreboards, State by State, governors/measures, ladder, manual import and live polling are preserved.

Development branch: `election-night-upgrades`. Pre-upgrade main: `f9d2f2aa3d3d94c00afc7e825355251bdc9c663f`. Roll back source changes by reverting the upgrade merge commit; retain subsequent election-data refresh commits. Do not force-reset main or erase newer results. A historical version can be inspected by that commit before reverting.

## Coverage and limitations

| Upgrade | Implementation | Limits |
|---|---|---|
| Change feed | Overview; 15/30/60-minute windows; Senate, House, battleground, turnout and call filters; observed vote, D–R margin, progress, seat, call, correction and health changes | History starts with collection; no earlier updates reconstructed. Source progress is an estimate, never percent of votes counted. Turnout events require actual imported turnout. |
| County maps | FL, IA, TX, KS, NC, MI, OH, GA, ME, AK; safe SVG path extraction; county table fallback; hover/focus/click details; votes, share, two-party margin | 2022 Senate baseline connected for NC only (100 counties); other historical baselines and 2024 presidential comparisons unavailable. County FIPS shown only when supplied. Missing map shapes use the county table; statewide view remains available. Alaska provider regions may not be counties. |
| Reporting charts | Actual stored observations for all feed-listed requested Senate races; D–R votes/pp, total votes, candidate totals, provider progress; call markers; exact observation table | Two distinct observations required. No interpolation, forecasts or backfill. UT/NV have no Senate contest in the connected feed. Five-minute durable observations plus browser observations while open. |
| Senate control | Attributed-result and hypothetical modes; candidate assignments; party-aware min/max ranges; reset; other/independent bucket; majority thresholds | Outgoing Senate baseline/net changes unavailable. Independents stay Other unless documented caucus metadata is added. Not-up D34 includes the previously sourced caucusing-independent baseline. Other independent winners are not assumed Democratic. |
| Closing timeline | 14 states, official sources, Eastern/Mountain conversions, split-zone windows, countdown, partial closure, reporting states | Not a complete 50-state schedule. Kansas uses statutory permitted range, not verified individual-county schedules. Local extensions can change closing/reporting. Governor roster details not yet attached. |
| Secondary source | Official NCSBE downloadable 2026 Senate precinct file; 100 counties; independent statewide candidate totals; source discrepancy panel | NC only. Retains civicAPI primary and never averages data. Source last-modified is nullable; retrieval is separate. Known NC candidate crosswalk: Shannon W. Bray (NCSBE) = Shannon Bray (civicAPI), same party. |

## Data sources

| Provider | Access / coverage | Cadence / licensing / status |
|---|---|---|
| [civicAPI docs](https://civicapi.org/api-documentation), [FAQ](https://civicapi.org/faq) | No key; national Senate race 87528, House 87524; 35 Senate and 435 House regions. Full race endpoint supplies county regions and generated SVG maps. State search supplies governors/measures. | FAQ describes active updates every 5–10 seconds and public commercial/noncommercial use with attribution. Numeric rate limit not located. Ten-second browser **checks** do not guarantee source updates. Backoff/Retry-After preserved. Representative Senate payload was test_data=false but source timestamp Oct 23, with zero reported votes; FL full-race county timestamp Nov 3, also zero votes. These are stale/unreported, not evidence of winners. |
| [NCSBE results data](https://www.ncsbe.gov/results-data/election-results/historical-election-results-data) | Public ZIP files; no key. Official authority, precinct candidate totals and voting methods. 2022 Senate history and 2026 Senate results parsed for all 100 counties. | State documents reporting every 5–10 minutes. Our background task checks every 5 minutes, best effort. No numeric throttle located; bounded requests. State explicitly offers media results downloads; no paid subscription used. Results remain unofficial until certified. |
| [AP](https://developer.ap.org/ap-elections-api/docs/Getting_Started.htm) | API key required; national/state/county results and calls | Not connected. Contract/public-display permission, price and per-key quota required; no free feed assumed. |
| [DDHQ](https://docs.decisiondeskhq.com/reference/get_api-v4-races) | Authenticated results API | Not connected. Pricing, rate limits and public redistribution rights unverified; no key supplied. |
| [Reuters](https://reutersagency.com/content-delivery-platforms/content-delivery) | Licensed content integrations | Research only. No free reusable results feed verified. No content scraping integrated. |
| [@elections/mcp](https://www.npmjs.com/package/@elections/mcp) | Package exists and advertises election data with an API key | Research only, not installed or independently validated. Vendor claims do not establish usable results coverage, pricing or redistribution rights. |

Primary/secondary candidate records remain separate. Differences produce warnings. Official NC data is not silently substituted into national totals. Historical NC county names are uniquely matched because the official precinct file lacks FIPS; unmatched geography has no swing. Third-party votes remain visible; D–R share/margin uses only D+R votes. Partial 2026 comparisons are explicitly provisional and cross-election.

## Storage and refresh

`Election_2026_Latest.json` retains its schema and adds canonical `contests`, provider contest IDs and candidate IDs. `Election_2026_Changes.json` stores event provenance, previous/next values, source/retrieval times and actual point histories. `Election_2026_Status.md` remains generated by the existing workflow. `data/counties/STATE.json` preserves full county last-good data; `data/secondary/NC.json` preserves separate official data; `data/history/NC-2022-senate.json` is static validated history. State catalogue fallback files remain unchanged in purpose.

GitHub Actions runs at UTC minutes 2,7,12,…57 (best effort). Direct national browser checks remain ~10 seconds with jitter/backoff, state catalogues ~60 seconds, selected governor/measure details ~10 seconds, counties ~60 seconds. Browser polling pauses in hidden/paused tabs. Snapshot/analysis downloads occur about once per minute. No keys stored in browser or repository. Source timestamps do not change just because a check succeeds.

GitHub repository files are publicly accessible. Existing ChatGPT Library files are **not synchronized** by this GitHub workflow and cannot be assumed current. The hourly ChatGPT task remains separate. Project-source attachment is not automatic. Repository files are the source of truth for this deployment.

## Validation

`node scripts/test-insights.mjs`: changes, duplicates, corrections, call/retraction, out-of-order observations, provider health transitions, independent/scenario isolation, margin/swing math, split-zone closings, conflicting sources, NC historical totals and dashboard syntax. Synthetic fixture values exist only in the test file and are not imported by production.

All twelve tabs passed isolated render checks. Representative real national payloads normalized to 470 contests. Schema hydration was checked to produce zero fabricated change events. Official NC download verified 100 counties; 2022 statewide totals: Ted Budd 1,905,786; Cheri Beasley 1,784,049 (other candidates retained). Initial 2026 NC totals zero; candidate rosters checked against primary with explicit Bray name alias.

CI runs syntax, pure functionality and Python compilation checks on the development branch and main. Browser/public-deployment checks are recorded in the PR and completion report after merge. Provider outage, invalid JSON, 429/backoff and empty-response handling remain in the existing fetch layer; production outages are never intentionally induced. Timeline completeness, 2024 comparison and nationwide independent-source coverage remain explicit gaps.
