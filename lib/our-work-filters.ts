// Our Work filter chips, in display order. `key` is the ?service= value and the prebuilt
// /[location]/our-work/[filter] page; next.config.ts rewrites one to the other. No imports here:
// next.config.ts reads this file.
export const WORK_FILTERS = [
  { key: 'interior', label: 'Interior' },
  { key: 'exterior', label: 'Exterior' },
  { key: 'cabinet', label: 'Cabinet' },
  { key: 'commercial', label: 'Commercial' },
] as const

export type WorkFilter = (typeof WORK_FILTERS)[number]['key']

export const isWorkFilter = (value: unknown): value is WorkFilter => WORK_FILTERS.some((filter) => filter.key === value)
