/**
 * Location names as the live site shows them, for scripts/seed-locations.ts (public data).
 * painter1.com is geo-blocked from where this was gathered, so the sources are:
 *   - "locations page": the live /locations/ directory, saved from a browser on Oct 7, 2026
 *     (docs/painter1-knoxville/pages/locations.html), the newest source and one consistent naming;
 *   - "homepage title": the location homepage's <title> in its latest real Internet Archive capture
 *     (docs/reference/live-site/locations/<slug>.html, gitignored), dated below.
 * Rule: the locations page name; else the homepage title's "Painter1 …" name; else the CSV's name. Upstate
 * uses its homepage title's name, and Scottsdale, Bozeman and Miami were checked on the live pages (Oct 20).
 * Otherwise: the CSV's name
 * (seed-locations falls back to it when a slug isn't here). `note`: where the sources disagree.
 */
type LiveName = { name: string; source: string; note?: string }

export const LIVE_LOCATION_NAMES: Readonly<Record<string, LiveName>> = {
  upstate: { name: 'Painter1 of Upstate SC', source: 'homepage title (Jun 2026); CSV; chosen by the developer (Oct 20)', note: 'locations page: "Painter1 of Upstate"' },
  'utah-county': { name: 'Painter1 of Utah County', source: 'locations page; homepage title (Jan 2026)' },
  columbus: { name: 'Painter1 of Columbus', source: 'locations page', note: 'homepage title (Apr 2026) has no name: "Painters in Columbus, OH"' },
  indianapolis: { name: 'Painter1 of Indianapolis', source: 'locations page', note: 'homepage title (Jan 2026) has no name: "Painters Indianapolis"' },
  'northern-utah': { name: 'Painter1 of Northern Utah', source: 'locations page; homepage title (Jan 2026)' },
  'greater-salt-lake': { name: 'Painter1 of Greater SLC', source: 'locations page; homepage title and H1 (Jun 2026)', note: 'the live site itself uses "Greater SLC"' },
  slc: { name: 'Painter1 of Salt Lake City', source: 'locations page; homepage title (Apr 2026)' },
  tulsa: { name: 'Painter1 of Tulsa', source: 'locations page; homepage title (Feb 2026)' },
  raleigh: { name: 'Painter1 of Raleigh', source: 'locations page; homepage title (Feb 2026)' },
  'mid-michigan': { name: 'Painter1 of Mid Michigan', source: 'locations page; homepage title (Apr 2026)' },
  'st-george': { name: 'Painter1 of St. George', source: 'locations page; homepage title (Apr 2026)' },
  'boca-raton': { name: 'Painter1 of Boca Raton', source: 'locations page', note: 'homepage title (Jan 2026) has no name: "Professional Painters Boca Raton"' },
  'park-city': { name: 'Painter1 of Park City', source: 'locations page; homepage title (Jan 2026)' },
  'highlands-ranch': { name: 'Painter1 of Highlands Ranch', source: 'locations page', note: 'homepage title (Jan 2026): "Painter1 of Highlands Ranch, CO"' },
  westminster: { name: 'Painter1 of Westminster', source: 'locations page', note: 'homepage title (Feb 2026) has no name: "Painters in Westminster, CO"' },
  'carmel-fishers': { name: 'Painter1 of Carmel Fishers', source: 'locations page', note: 'homepage title (Jan 2026): "Painter1 of Carmel / Fishers"; CSV: "Painter1 of Carmel Fisher"' },
  cincinnati: { name: 'Painter1 of Cincinnati', source: 'locations page; homepage title (Apr 2024)' },
  'greater-orlando': { name: 'Painter1 of Greater Orlando', source: 'locations page', note: 'homepage title (Jan 2026) has no name: "Painters in Greater Orlando"' },
  'greater-north-austin': { name: 'Painter1 of Greater North Austin', source: 'locations page; homepage title (May 2026)' },
  'inland-northwest': { name: 'Painter1 of Inland Northwest', source: 'locations page', note: 'homepage title (Jan 2026): "Painter1 Inland Northwest"; CSV: "Painter1 of Inland NW"' },
  dallas: { name: 'Painter1 of Dallas', source: 'locations page; homepage title (Jun 2026)' },
  'charlotte-metro': { name: 'Painter1 of Charlotte Metro', source: 'locations page; homepage title (Jan 2026)' },
  memphis: { name: 'Painter1 of Memphis', source: 'locations page; homepage title (Jan 2026)' },
  'main-line': { name: 'Painter1 of Bryn Mawr/Main Line', source: 'locations page', note: 'homepage title (Jun 2024): "Painter1 of Main Line", H1 "Painters in Bryn Mawr / Main Line"; CSV: "Painter1 of Main Line"' },
  'north-georgia': { name: 'Painter1 of North Georgia', source: 'locations page; homepage title (Jan 2026)' },
  dfw: { name: 'Painter1 of DFW', source: 'locations page; homepage title (Jan 2026)' },
  'austin-metro': { name: 'Painter1 of Austin Metro', source: 'locations page; homepage title (Jan 2026)' },
  marietta: { name: 'Painter1 of Marietta', source: 'locations page; homepage title (Apr 2024)' },
  'bayou-city': { name: 'Painter1 of Bayou City', source: 'locations page', note: 'homepage title (Jun 2024): "Painter1 Bayou City", H1 "Painters in Bayou City/Houston"' },
  southatl: { name: 'Painter1 of South Atlanta', source: 'locations page; homepage title (Jan 2026)' },
  'central-florida': { name: 'Painter1 of Central Florida', source: 'locations page; homepage title (Apr 2024)' },
  'coastal-carolina': { name: 'Painter1 of Coastal Carolina', source: 'locations page; homepage title (Jun 2026)' },
  portland: { name: 'Painter1 of Portland', source: 'locations page; homepage title (Jan 2026)' },
  // Not on the locations page and no real archive capture; the live pages were checked in a browser (Oct 20)
  scottsdale: { name: 'Painter1 of Scottsdale', source: 'live page, checked in a browser by the developer (Oct 20); CSV' },
  bozeman: { name: 'Painter1 of Bozeman', source: 'live page, checked in a browser by the developer (Oct 20); CSV' },
  miami: { name: 'Painter1 of Miami', source: 'live page, checked in a browser by the developer (Oct 20); CSV' },
}
