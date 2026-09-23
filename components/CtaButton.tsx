import Link from 'next/link'
import type { ComponentProps } from 'react'

const variants = {
  orange: 'bg-brand-orange text-white hover:bg-brand-orange-dark',
  blue: 'bg-brand-blue text-white hover:bg-brand-blue-dark',
  white: 'bg-white text-brand-orange hover:bg-orange-50',
  outline: 'border-2 border-white text-white hover:bg-white/10',
}

type Props = ComponentProps<typeof Link> & { variant?: keyof typeof variants; size?: 'md' | 'lg' }

export default function CtaButton({ variant = 'orange', size = 'lg', className = '', ...props }: Props) {
  const sizing = size === 'lg' ? 'px-6 py-3.5 text-lg' : 'px-5 py-2.5 text-base'
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-bold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${sizing} ${variants[variant]} ${className}`}
    />
  )
}
