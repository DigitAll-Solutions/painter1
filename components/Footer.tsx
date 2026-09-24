import Image from 'next/image'
import Link from 'next/link'
import { ChevronUp } from 'lucide-react'

import CtaButton from './CtaButton'
import SocialIcons from './SocialIcons'
import { formatAddress, getCta, servicePages, telHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

const heading = 'text-sm font-extrabold uppercase tracking-[0.25em] text-ink'

export default function Footer({ location }: { location: Location }) {
  const base = `/${location.slug}`
  const cta = getCta(location)
  const tel = telHref(location.phone)
  const address = formatAddress(location.address)
  const maintenance = location.locationType === 'maintenance'

  const services = maintenance
    ? []
    : servicePages.flatMap(({ key, path }) => {
        const title = location.services?.[key]?.title
        return title ? [{ label: title, href: `${base}/${path}` }] : []
      })
  const serviceLinks = [
    ...services,
    ...(maintenance ? [] : [{ label: 'Our Work', href: `${base}/our-work` }]),
    { label: 'About Us', href: `${base}/about-us` },
    { label: 'Free Estimate', href: cta.href },
  ]

  const legalLinks = [
    ...(maintenance
      ? []
      : [
          { label: 'Reviews', href: `${base}/reviews` },
          { label: 'Warranty', href: `${base}/warranty` },
        ]),
    { label: 'Privacy Policy', href: `${base}/privacy-policy` },
    { label: 'Do Not Sell or Share My Personal Information', href: `${base}/privacy-policy#do-not-sell` },
  ]

  return (
    <footer className="border-t-2 border-brand-blue bg-mist text-slate-600">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
        <div>
          <Image src="/painter1-logo.svg" alt="Painter1" width={1582} height={505} className="h-14 w-auto" />
          {location.tagline && <p className="mt-5 text-lg font-bold text-ink">{location.tagline}</p>}
          <p className="mt-1">{location.name}</p>
        </div>

        <div>
          <h2 className={heading}>Our Services</h2>
          <ul className="mt-6 space-y-3">
            {serviceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand-blue-text">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={heading}>Get In Touch</h2>
          <ul className="mt-6 space-y-3">
            {tel && (
              <li>
                <a href={tel} className="text-lg font-bold text-ink hover:text-brand-blue-text">
                  {location.phone}
                </a>
              </li>
            )}
            {location.email && (
              <li>
                <a href={`mailto:${location.email}`} className="break-all hover:text-brand-blue-text">
                  {location.email}
                </a>
              </li>
            )}
            {address.length > 0 && (
              <li>
                <address className="not-italic">
                  {address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </li>
            )}
            {location.businessHours?.length ? (
              <li className="text-sm">
                {location.businessHours.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h2 className={heading}>Follow Us</h2>
          <div className="mt-6">
            <SocialIcons links={location.socialLinks} />
          </div>
          <CtaButton href={cta.href} className="mt-8 w-full py-4 tracking-wide uppercase shadow-lg">
            {cta.label}
          </CtaButton>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-4 border-t border-slate-200 py-7 text-sm md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {location.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand-blue-text">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href="#top"
            aria-label="Back to top"
            className="flex size-12 items-center justify-center self-end rounded-full bg-brand-blue text-white shadow-lg ring-4 ring-brand-blue/20 transition-colors hover:bg-brand-blue-dark md:self-auto"
          >
            <ChevronUp className="size-6" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  )
}
