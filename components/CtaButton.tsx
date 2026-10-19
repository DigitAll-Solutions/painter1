import Link from '@/components/IntentLink'
import type { ComponentProps } from 'react'

const variants = {
  orange: 'bg-cta text-white hover:bg-cta-dark',
  blue: 'bg-brand-blue text-white hover:bg-brand-blue-dark',
  navy: 'bg-navy text-white hover:bg-ink',
  white: 'bg-white text-cta hover:bg-orange-50',
  outline: 'border-2 border-white text-white hover:bg-white/10',
}

type Props = ComponentProps<typeof Link> & { variant?: keyof typeof variants; size?: 'md' | 'lg'; booking?: boolean }

/** Props for a link to the location's booking page: same tab, UTMs added on click (AttributionCapture) */
export const bookingLinkProps = (href: string) => ({ href, 'data-booking-href': href })

export default function CtaButton({ variant = 'orange', size = 'lg', className = '', booking = false, ...props }: Props) {
  const sizing = size === 'lg' ? 'px-6 py-3.5 text-lg' : 'px-5 py-2.5 text-base'
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl font-bold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${sizing} ${variants[variant]} ${className}`
  if (booking && typeof props.href === 'string') {
    // Another site (schedule.painter1.com): a plain link, no prefetch
    const { href, children } = props
    return (
      <a {...bookingLinkProps(href)} className={classes}>
        {children}
      </a>
    )
  }
  return <Link {...props} className={classes} />
}
