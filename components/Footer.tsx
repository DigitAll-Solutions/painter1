import Image from 'next/image'
import Link from 'next/link'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'

import SocialIcons from './SocialIcons'
import { formatAddress, getCta, telHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

export default function Footer({ location }: { location: Location }) {
  const base = `/${location.slug}`
  const cta = getCta(location)
  const tel = telHref(location.phone)
  const address = formatAddress(location.address)

  const links = [
    ...(location.locationType === 'maintenance'
      ? []
      : [
          { label: 'Our Work', href: `${base}/our-work` },
          { label: 'Reviews', href: `${base}/reviews` },
          { label: 'Warranty', href: `${base}/warranty` },
        ]),
    { label: 'About Us', href: `${base}/about-us` },
    { label: 'Free Estimate', href: cta.href },
    { label: 'Privacy Policy', href: `${base}/privacy-policy` },
  ]

  return (
    <footer className="bg-ink text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image src="/painter1-logo-white.svg" alt="Painter1" width={1582} height={505} className="h-12 w-auto" />
          {location.tagline && <p className="mt-4 text-lg font-semibold text-white">{location.tagline}</p>}
          <p className="mt-2 text-sm">{location.name}</p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Our Links</h2>
          <ul className="mt-4 space-y-2.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Get In Touch</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {address.length > 0 && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-orange" aria-hidden />
                <address className="not-italic">
                  {address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </li>
            )}
            {tel && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-orange" aria-hidden />
                <a href={tel} className="hover:text-white">
                  {location.phone}
                </a>
              </li>
            )}
            {location.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-orange" aria-hidden />
                <a href={`mailto:${location.email}`} className="break-all hover:text-white">
                  {location.email}
                </a>
              </li>
            )}
            {location.businessHours?.length ? (
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand-orange" aria-hidden />
                <span>
                  {location.businessHours.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Follow Us</h2>
          <div className="mt-4">
            <SocialIcons links={location.socialLinks} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            Copyright © {new Date().getFullYear()} {location.name}. All Rights Reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href={`${base}/privacy-policy`} className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href={`${base}/privacy-policy#do-not-sell`} className="hover:text-white">
                Do Not Sell or Share My Personal Information
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
