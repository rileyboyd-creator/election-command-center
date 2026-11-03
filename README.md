# Riley–Cal Election Night Command Center

Open index.html in a modern browser. No installation or payment is required. Data persists in that browser only. For a compatible HTTPS feed, serve this folder locally with `python3 -m http.server 8000` and open http://localhost:8000. Browser CORS restrictions still apply.

## Operating workflow
Open Update, import Election_2026_Latest.json, then inspect Overview, Senate, Florida and Ladder. Export a backup after updates. Start refresh only for a feed you have permission to use. Browser refresh does not research websites or refresh Library files. Scheduled research is a separate process; import its newest snapshot manually. Automatic browser updates stop when the page closes.

Each record requires source, url, updated (ISO timestamp), scope, definition and status (official/unofficial/projection/polling/turnout). Root fields: version:1, updated, national, races:[], turnout:[], events:[]. Empty arrays mean unavailable. Never substitute zero for unknown vote totals.

National house/senate objects: d, r, other, uncalled, heldD, heldR, heldOther, baselineD:null plus provenance. d/r include seats not up and independents who caucus with that party; held fields are subsets. All seats must sum to 435/100. An uncalled race is not an independent seat. Net change requires a sourced baselineD. Media projections are not certification.

Race example (illustrative schema only; do not import fictional numbers): state:'MI', candidates:[{name:'Verified ballot name',party:'D',votes:integer},...], counted:null, countedDefinition:'', seatStatus:'verified open/incumbent', rule:'verified rule', call:null, plus provenance. A call requires callSource and callUrl. At present one Senate race per state is supported. County returns and polling averages are not implemented.

Turnout records: party, mode, ballots (nonnegative integer), registered (integer or null), plus provenance; status must be turnout. Use a separate scope for statewide versus county data. Do not sum overlapping modes or geography. Candidate support cannot be inferred from registered party.

Events: id (unique), title, type (Senate/House/turnout/correction/poll closure), state (optional), plus provenance. Event timestamps are source publication times, not retrieval times.

## Reliability
Imports validate atomically and preserve the last good snapshot on failure. Older/equal root timestamps are rejected. Corrections must have a newer snapshot timestamp and an explicit correction event with source; decreasing counts are permitted for corrections. Source timestamps remain visible. Staleness warning appears after ten minutes. Complete snapshots replace prior snapshots, so retain all records you want preserved. Race calls are recorded manually, never inferred. Results are not estimates unless explicitly labelled. Held seats are not election-night wins.

The public Election Outcome Ladder has six Republican-favored and six Democratic-favored scenarios with neutral names. Parallel tiers use the same House/Senate thresholds: gains 225/50, wave 235/52, strong wave 245/53, broad sweep 250/54, historic sweep 255/55. Each side also has a split-control scenario: House ≥218 and its Senate caucus ≤49, with the opposing Senate majority secured (D ≥51; R ≥50 with the Republican vice president). The gains milestone does not itself imply Democratic Senate control at 50 seats. Both chamber conditions must be secured; partial leads never count as calls. Scenario labels are custom milestones, not endorsements, probabilities or historical equivalences. Complete calls are not certification. Thresholds are stored under rc-ladder-public-v1 on each device; older private labels are not restored. Reset restores defaults. Election source data is unaffected.

## Tonight
East: Florida turnout then actual returns; wait for the full state's reporting release. Midwest: MI/OH/IA/KS/TX; compare the same counties and election types. West: watch late ballots and election rules, especially Alaska. Check source time before reacting. A partial national popular vote is not representative.

## Limitations
No licensed API, automatic official-site scraping, county maps, district House data, candidate roster verification, polls, historical comparisons or poll-close schedule is loaded. The map is a labelled tile index, not a geographic choropleth. UT/NV have no regular Senate contest. Florida and Ohio have special contests. Senate rules and all final ballot rosters require verification before loading. Public-source availability is not automated-use permission. JSON import/export is supported; CSV import is not yet supported. No background hosting service is configured. Browser visual QA has not been completed; functional logic is checked with Node.


## GitHub refresh setup
The dashboard fetches the adjacent JSON automatically on load and every five minutes when served over HTTP(S). Opened directly from disk, use manual import instead. The GitHub Actions workflow runs at minutes 2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57 UTC each hour; scheduling is best effort and may be delayed. It also supports Run workflow. It does not research arbitrary websites.

**civicAPI is connected as the default results source.** No key or repository variable is needed. The adapter fetches national House (87524) and Senate (87528) payloads, checks the live-data flag and exact election/coverage, then converts candidate totals and civicAPI calls. Attribution: https://civicapi.org . These are unofficial returns and civicAPI projections, not AP calls or certification. Initial payloads had no reported votes and source timestamps dated October 23; source timestamps are preserved and remain visibly stale until the provider changes them.

The 34 Democratic-caucus / 31 Republican Senate not-up baseline comes from the separately sourced initial snapshot; the adapter adds only explicit civicAPI winner flags. Independents remain Other until caucus is separately verified. Regional calls must reconcile with provider national allocated seats. Two successful endpoints and all validation must pass before replacing the JSON. No county/Florida turnout feed is connected yet. A configured ELECTION_FEED_URL overrides civicAPI only if you supply a permitted feed in this dashboard's normalized schema.

Missing/failed feeds produce a failed workflow, source-health.json and a Markdown status report; cached election data remains unchanged. A successful poll with identical data keeps the snapshot timestamp unchanged. Source timestamps are separate from retrieval/check time. The GitHub workflow is independent of the hourly ChatGPT task. The CivicAPI connection test workflow stores its raw test response in civicapi-probe.json for diagnosis.

To host on GitHub Pages, select Settings → Pages → Deploy from a branch → main → /(root). This requires an account-side setting not available through the connected GitHub tools. Publishing the repository alone does not enable Pages. Repository files and snapshots are public because this repository is public.

The separate ChatGPT hourly task updates the shared files, not this GitHub repository. They are not automatically synchronized. The default civicAPI adapter supplies new browser data when the provider publishes it. Shared ChatGPT files are not automatically synchronized with GitHub.


## Fast live mode
The public dashboard directly polls civicAPI's two national endpoints approximately every 10 seconds while visible, with random jitter and no overlapping requests. It pauses when hidden or manually paused. On errors it falls back to the published snapshot, backs off (30 seconds to five minutes), and honors longer Retry-After values. A success restores the fast cadence. Direct browser access depends on provider CORS; connectivity in GitHub alone does not prove browser access. Source timestamps and stale warnings remain visible. No winner is inferred from vote leads.

GitHub background collection now runs at UTC minutes 2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57 (best effort). Open dashboards check the published snapshot every minute. Browser and server use the same adapter and validator. Provider data may update less frequently; polling is not a freshness guarantee. Refresh now, pause/resume, and copy-link controls are in the header. No signup is needed to view the public dashboard after Pages is enabled.


## Expanded State Labs
Florida turnout is integrated into the Florida lab; the separate Florida navigation tab is removed. State Labs opens Florida by default, with search, a 32-state expanded watchlist, and an All 50 states option. The watchlist is a custom monitoring list rather than a polling-based competitiveness rating. Each available Senate lab shows candidates, incumbency flags, reported votes and calculated shares/top-two margin, civicAPI call status and source timestamp. Zero overall votes render as Awaiting returns. Non-Senate states explicitly describe their coverage gap; governor and House district lab detail, county results and historical comparisons are not connected. Florida official turnout links and imported records remain available without inferring candidate support from party registration.
