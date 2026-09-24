import { siFacebook, siGoogle, siInstagram, siYelp, siYoutube } from 'simple-icons'

import type { Location } from '@/sanity/lib/types'

const networks = [
  { key: 'facebook', label: 'Facebook', icon: siFacebook },
  { key: 'google', label: 'Google', icon: siGoogle },
  { key: 'instagram', label: 'Instagram', icon: siInstagram },
  { key: 'yelp', label: 'Yelp', icon: siYelp },
  { key: 'youtube', label: 'YouTube', icon: siYoutube },
] as const

export default function SocialIcons({ links }: { links: Location['socialLinks'] }) {
  const items = networks.filter(({ key }) => links?.[key])
  if (!items.length) return null

  return (
    <ul className="flex flex-wrap gap-3">
      {items.map(({ key, label, icon }) => (
        <li key={key}>
          <a
            href={links![key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="flex size-12 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-brand-blue hover:text-white hover:ring-brand-blue"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
              <path d={icon.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
