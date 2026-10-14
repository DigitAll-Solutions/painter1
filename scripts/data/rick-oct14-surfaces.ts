// Rick's Oct 14 surface copy, extracted word for word from his messages (docs/painter1-knoxville/
// rick-oct14-messages.txt, gitignored). Only change: Brick "[10-12] years" → "10-12 years" (Rick confirmed).
// Used by scripts/seed-oct14.ts --surface-copy. Keys are the surfaces' link names.
export type SurfaceCopy = { title: string; intro: string; items: string[]; extras: string[]; whatYouGet: string; warrantyNote: string | null }

export const RICK_OCT14_COPY: Record<'exterior' | 'interior', Record<string, SurfaceCopy>> = {
  "exterior": {
    "siding": {
      "title": "Siding",
      "intro": "Paint can give tired siding a new color and a uniform finish for far less than replacing it, as long as the prep matches the material.",
      "items": [
        "Identify the material first. Vinyl, aluminum, wood and fiber cement each need different prep and paint.",
        "Clean thoroughly. We remove dirt, mildew and the chalky oxidation common on aluminum, because paint won’t bond over it.",
        "Repair before painting. We scrape loose paint, spot-prime bare wood and caulk open joints.",
        "Choose a safe color for vinyl. Very dark colors absorb heat and can warp vinyl siding, so we use Sherwin-Williams VinylSafe® colors, made to stay within safe heat limits."
      ],
      "extras": [],
      "whatYouGet": "What you get: a new exterior color without the cost of new siding, on a finish that bonds properly and wears evenly.",
      "warrantyNote": null
    },
    "brick": {
      "title": "Brick",
      "intro": "Painting brick is a long-term decision. Once brick is painted, going back to bare brick is difficult and expensive, so we’ll tell you honestly whether your brick is a good candidate before we quote it.",
      "items": [
        "Inspect and repair first. We check for moisture problems, efflorescence (white mineral deposits) and cracked or loose mortar.",
        "Clean, then let it dry completely. Masonry primer.",
        "Breathable topcoat. Brick has to release moisture. Paint that traps it leads to peeling and spalling, where the brick face flakes off."
      ],
      "extras": [],
      "whatYouGet": "What you get: a completely updated look on a coating made for masonry. Expect a refresh about every 10-12 years, which is more upkeep than bare brick.",
      "warrantyNote": "Warranty note: moisture damage and existing efflorescence aren’t covered."
    },
    "stucco": {
      "title": "Stucco",
      "intro": "Stucco lasts a long time, but it cracks, holds dirt and needs coatings that work with the way it moves and breathes.",
      "items": [
        "Identify what you have. We confirm whether it’s traditional stucco or EIFS (synthetic stucco), because they need different products.",
        "Repair cracks. We fill hairline cracks with a flexible patch. Larger cracks can point to moisture or settling problems, and we’ll flag them rather than paint over them.",
        "Clean and prime as needed. We wash off dirt and mildew. Masonry primer goes on new or patched areas.",
        "Choose the right coating for the wall. Elastomeric coatings bridge hairline cracks, and breathable masonry paint suits walls that need to release moisture. We’ll recommend one based on your wall."
      ],
      "extras": [],
      "whatYouGet": "What you get: repaired cracks and a uniform, flexible finish on a coating chosen for your wall.",
      "warrantyNote": "Warranty note: cracks caused by the building shifting aren’t covered."
    },
    "trim-doors": {
      "title": "Trim & Doors",
      "intro": "Trim takes the most weather on a house, and paint failure usually starts at its joints. Doors are the most visible change you can make for the money.",
      "items": [
        "Scrape and sand failing paint. We take trim back to a sound surface.",
        "Seal the joints. We caulk gaps at corners and seams and spot-prime bare wood so water can’t get in."
      ],
      "extras": [
        "Doors and garage doors: we mask or remove hardware, sand for adhesion, and apply a durable enamel that stands up to handling and weather."
      ],
      "whatYouGet": "What you get: sharp, clean lines, sealed joints that keep water out of the wood, and doors with a hard, washable finish.",
      "warrantyNote": "Warranty note: rotted wood isn’t covered."
    },
    "decks": {
      "title": "Decks",
      "intro": "Decks wear faster than any other painted surface. They get foot traffic, standing water and direct sun, so the right product matters more here than anywhere else on the house.",
      "items": [
        "Stain or paint? We’ll recommend one. Stain soaks into the wood and wears down gradually. Paint forms a film that can peel under foot traffic.",
        "Clean and strip. We wash off dirt and mildew and remove failing coatings.",
        "Let the wood dry. Wet wood won’t take stain well. New pressure-treated lumber usually needs time to weather before it can be stained.",
        "Apply deck-rated products."
      ],
      "extras": [],
      "whatYouGet": "What you get: a deck that looks right again, protected against water and sun, with a realistic plan for how often it will need a refresh.",
      "warrantyNote": "Warranty note: decks are horizontal and stained surfaces, so they’re excluded from the 2-year workmanship warranty."
    },
    "fences": {
      "title": "Fences",
      "intro": "A fence is a lot of surface area: every board, both sides, with landscaping right up against it.",
      "items": [
        "Clean first. We wash off mildew and graying so the stain or paint bonds.",
        "Stain or paint, matched to the wood and the look you want.",
        "Spray and back-brush. Spraying gets even coverage on rough boards, and back-brushing works the product into the wood. We protect plants, hardscape and nearby cars from overspray.",
        "Both sides? For fences on a property line, we’ll confirm neighbor access before we start."
      ],
      "extras": [
        "Metal fences: we remove loose rust and prime with a rust-inhibiting primer."
      ],
      "whatYouGet": "What you get: an even, protected finish on every board, with no overspray on your yard.",
      "warrantyNote": "Warranty note: stained surfaces, galvanized metal and rusted metal aren’t covered."
    }
  },
  "interior": {
    "walls": {
      "title": "Walls",
      "intro": "Walls are most of what you see in a room, and most of what makes a paint job look professional happens before the paint goes on.",
      "items": [
        "Repair the surface. We fill nail holes and dings, repair dents and small drywall cracks, and sand the patches smooth.",
        "Spot-prime the patches. Unprimed patches absorb paint differently and show through as dull or shiny spots, called flashing, even after two coats.",
        "Clean where needed. We degrease kitchen walls, because paint won’t bond over grease.",
        "Cut in by hand, then roll. Big color changes, especially dark to light, may need a primer coat first, and that will be in your estimate.",
        "Match the sheen to the room. Flat or matte hides imperfections. Eggshell or satin wipes clean in busy living areas. Satin or semi-gloss stands up to moisture in kitchens and bathrooms."
      ],
      "extras": [],
      "whatYouGet": "What you get: even color with no patches showing through, crisp lines at the ceiling and trim, and a sheen suited to how each room is used.",
      "warrantyNote": "Warranty note: drywall and plaster cracks can reappear as a house settles, so they aren’t covered. Paint for future touch-ups can be matched closely, but rarely perfectly."
    },
    "ceilings": {
      "title": "Ceilings",
      "intro": "Ceilings are the hardest surface in a room to paint well. You’re working overhead, every drip lands on something, and stains come back through ordinary paint.",
      "items": [
        "Protect everything below. We cover floors and furniture completely before any ceiling work starts.",
        "Block stains first. Water stains, smoke and nicotine bleed through regular paint, so we seal them with a stain-blocking primer. If the stain is from a leak, the leak has to be fixed first.",
        "Use flat ceiling paint. It hides surface imperfections and cuts glare from lights and windows."
      ],
      "extras": [
        "Textured ceilings: we use the right roller or spray method for the texture. Popcorn ceilings in homes built before the mid-1980s should be tested for asbestos before they’re disturbed."
      ],
      "whatYouGet": "What you get: a bright, uniform ceiling with no roller marks, stains that stay gone, and floors and furniture exactly as they were before the work.",
      "warrantyNote": "Warranty note: cracks and moisture damage aren’t covered."
    },
    "trim": {
      "title": "Trim",
      "intro": "Baseboards, crown molding and window and door casings take more scuffs and cleaning than any other interior surface, and they’re where sloppy painting shows first.",
      "items": [
        "Clean and scuff-sand. Trim collects grime, and glossy old paint needs sanding so the new coat grips.",
        "Check what’s already on it. Latex paint over old oil-based paint will peel unless it goes over a bonding primer, so we test before we paint.",
        "Fill and caulk. We fill nail holes and caulk the gaps where trim meets the wall. That’s what makes the lines look sharp.",
        "Seal knots and stained wood. Knots in pine trim, and stained trim being painted for the first time, get a stain-blocking primer so nothing bleeds through.",
        "Use a durable enamel that holds up to vacuums, shoes and regular wiping."
      ],
      "extras": [],
      "whatYouGet": "What you get: crisp, caulked lines, no old finish showing through, and trim you can wipe clean.",
      "warrantyNote": "Warranty note: knots that bleed through aren’t covered. Painting stained trim is hard to undo, so we’ll talk it through before we start."
    },
    "doors": {
      "title": "Doors",
      "intro": "Interior doors get handled every day, so they need the hardest finish in the house and the most careful technique.",
      "items": [
        "Remove or mask hardware. We do this instead of painting around it, so the edges come out clean.",
        "Sand for adhesion, using a bonding primer over old oil-based or glossy finishes.",
        "Paint in the right order. On paneled doors, we paint the panels first and then the frame around them, which prevents lap marks and streaks.",
        "Allow time to cure. Enamel feels dry within hours but takes longer to harden. We’ll tell you how long to leave doors open so they don’t stick to the frames."
      ],
      "extras": [],
      "whatYouGet": "What you get: a smooth, hard finish on the most-touched surface in your home, door frames to match, and hardware put back clean.",
      "warrantyNote": null
    }
  }
}
