import {
  BrickWall,
  DoorClosed,
  DoorOpen,
  Droplets,
  Fence,
  Frame,
  House,
  Layers,
  Paintbrush,
  PaintBucket,
  PaintRoller,
  PanelTop,
  Ruler,
  Rows3,
  Sofa,
  Sun,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

// Icons editors can pick for "What We Paint" cards. The Sanity field stores the key;
// unknown keys fall back to the paint roller so a card never renders without an icon.
export const SERVICE_ICONS = {
  PaintRoller,
  Paintbrush,
  PaintBucket,
  Layers,
  PanelTop,
  Ruler,
  DoorOpen,
  DoorClosed,
  Frame,
  House,
  BrickWall,
  Warehouse,
  Rows3,
  Fence,
  Sofa,
  Sun,
  Droplets,
} satisfies Record<string, LucideIcon>

export type ServiceIconName = keyof typeof SERVICE_ICONS

export const serviceIcon = (name?: string): LucideIcon =>
  (name && name in SERVICE_ICONS ? SERVICE_ICONS[name as ServiceIconName] : undefined) ?? PaintRoller

export const SERVICE_ICON_OPTIONS: { title: string; value: ServiceIconName }[] = [
  { title: 'Paint roller', value: 'PaintRoller' },
  { title: 'Paintbrush', value: 'Paintbrush' },
  { title: 'Paint bucket', value: 'PaintBucket' },
  { title: 'Layers (coatings, stucco)', value: 'Layers' },
  { title: 'Panel (ceiling)', value: 'PanelTop' },
  { title: 'Ruler (trim)', value: 'Ruler' },
  { title: 'Door (open)', value: 'DoorOpen' },
  { title: 'Door (closed)', value: 'DoorClosed' },
  { title: 'Frame (windows, casings)', value: 'Frame' },
  { title: 'House (siding)', value: 'House' },
  { title: 'Brick wall', value: 'BrickWall' },
  { title: 'Garage / outbuilding', value: 'Warehouse' },
  { title: 'Boards (decks)', value: 'Rows3' },
  { title: 'Fence', value: 'Fence' },
  { title: 'Sofa (furniture protection)', value: 'Sofa' },
  { title: 'Sun (weather)', value: 'Sun' },
  { title: 'Droplets (moisture)', value: 'Droplets' },
]
