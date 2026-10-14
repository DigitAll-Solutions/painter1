// Rick's Oct 14 cabinet surface copy (docs/painter1-knoxville/rick-oct14-cabinet-copy.txt, gitignored),
// word for word except his bracketed "confirm" parts, which vary by location. Those use the neutral
// versions in NEUTRAL below (agreed Oct 14). "Painting", never "refinishing".
// Used by scripts/seed-surface-defaults.ts --cabinet-copy. Keys are the surfaces' link names (unchanged).
import type { SurfaceCopy } from './rick-oct14-surfaces.ts'

export const RICK_OCT14_CABINET: Record<string, SurfaceCopy> = {
  'kitchen-cabinets': {
    title: 'Kitchen Cabinets',
    intro:
      'Painting your cabinets gives your kitchen a new look for far less than replacing or refacing them. Cabinets get handled every day, so the result depends almost entirely on prep and the right product.',
    items: [
      'Remove and label everything. Doors, drawer fronts and hardware come off and are labeled, so every piece goes back exactly where it came from.',
      'Degrease thoroughly. Kitchen cabinets carry years of cooking grease that you often can’t see. Paint won’t bond over it, and skipping this step is the most common reason cabinet paint fails.',
      'Sand and repair. We scuff-sand the existing finish so the primer grips, and fill dings and gouges.',
      'Prime with a bonding, stain-blocking primer. It sticks to slick factory finishes, and it stops wood tannins from bleeding through, which is common with oak and cherry.',
      'Address the grain. Oak’s open grain shows through paint, so we’ll show you what to expect before we start.',
      'Apply a cabinet-grade enamel made for the wear cabinets take.',
      'Put it all back together. We rehang the doors and adjust the hinges so everything lines up and closes evenly.',
    ],
    extras: [],
    whatYouGet:
      'What you get: a kitchen that looks updated, with a hard, washable finish and doors that close evenly, without the cost or downtime of new cabinets. Your estimate will include how long your kitchen will be out of service. The finish keeps hardening for a few weeks, so go gently with it at first.',
    warrantyNote: 'Warranty note: the warranty covers peeling and blistering from workmanship. Chips and wear from everyday use aren’t covered.',
  },
  'bathroom-vanities': {
    title: 'Bathroom Vanities',
    intro: 'A painted vanity is one of the quickest ways to update a bathroom. It just has to be done with moisture in mind.',
    items: [
      'Check for water damage first. Vanities sit under sinks and often hide small leaks. Particleboard or MDF that has swollen from water won’t take paint well, and we’ll tell you if a vanity needs repair or replacement before painting it.',
      'Clean mildew and residue. Soap scum and mildew have to be removed completely for paint to bond.',
      'Mask the countertop, sink and faucet, and remove the doors, drawers and hardware.',
      'Sand, prime and enamel, using the same bonding primer and cabinet-grade enamel as kitchen cabinets, which holds up to humidity and splashes.',
      'Coordinate with the rest of the room. Vanities are often painted along with the bathroom walls and trim, so all the colors are chosen together.',
    ],
    extras: [],
    whatYouGet: 'What you get: a vanity that matches an updated bathroom, on a finish made to handle daily moisture, without paying for a new vanity.',
    warrantyNote: 'Warranty note: moisture damage, including damage from leaks, isn’t covered.',
  },
  // Link name stays "hardware-upgrades" so existing links keep working
  'hardware-upgrades': {
    title: 'Cabinet Hardware',
    intro: 'New knobs and pulls finish a cabinet painting job. And the best time to change hardware is while the cabinets are being painted.',
    items: [
      'Measure the hole spacing first. If the new pulls match the spacing of the old holes, it’s a direct swap.',
      'Fill old holes before painting. If the spacing is different, we fill the old holes before the cabinets are primed and painted, so they disappear completely. Doing that after painting means touch-ups that show.',
      'Drill with a template. We use a drilling template so every pull sits at the same height and is level from door to door.',
    ],
    // Labelled lines, shown like "Textured ceilings:" on interior: bold label, then the text
    extras: [
      'Hinges: painted-over hinges look cheap and wear quickly, so we never paint over them.',
      'Hardware selection: we’ll help you choose, and your estimate will spell out who supplies it.',
    ],
    whatYouGet: 'What you get: hardware that’s straight and level on every door and drawer, no old holes showing, and a finished look that matches the new paint.',
    warrantyNote: 'Warranty note: the hardware itself is covered by its manufacturer.',
  },
}

/** Lines that differ from Rick's text on purpose (his bracketed "confirm" parts vary by location) */
export const NEUTRAL = new Set([
  'Address the grain. Oak’s open grain shows through paint, so we’ll show you what to expect before we start.',
  'What you get: a kitchen that looks updated, with a hard, washable finish and doors that close evenly, without the cost or downtime of new cabinets. Your estimate will include how long your kitchen will be out of service. The finish keeps hardening for a few weeks, so go gently with it at first.',
  'New knobs and pulls finish a cabinet painting job. And the best time to change hardware is while the cabinets are being painted.',
  'Hinges: painted-over hinges look cheap and wear quickly, so we never paint over them.',
  'Hardware selection: we’ll help you choose, and your estimate will spell out who supplies it.',
  'Warranty note: the hardware itself is covered by its manufacturer.',
])
