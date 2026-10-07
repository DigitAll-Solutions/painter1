import type { CSSProperties, ImgHTMLAttributes } from 'react'
import { preload as preloadResource } from 'react-dom'

import { urlFor } from '@/sanity/lib/image'
import type { SanityImage as SanityImageType } from '@/sanity/lib/types'

// Server-rendered <img> with a Sanity CDN srcset, so images ship no client JS.
const WIDTHS = [320, 480, 640, 828, 1080, 1280, 1600, 1920]

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'alt' | 'width' | 'height'> & {
  image: SanityImageType
  alt?: string
  /** width / height; when set, the image is cropped around its hotspot */
  aspect?: number
  /** Stretch to cover the nearest positioned parent */
  fill?: boolean
  /** Largest rendered width in CSS pixels; caps the srcset. Defaults to the source width. */
  width?: number
  height?: number
  /** Above-the-fold image: preload it and fetch with high priority */
  preload?: boolean
  /**
   * With `fill` only: render without src/srcset (kept in data-src/data-srcset) so a client
   * IntersectionObserver decides when it loads; a <noscript> copy shows it without JavaScript.
   */
  deferred?: boolean
  quality?: number
}

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const cssText = (style: CSSProperties = {}) =>
  Object.entries(style)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${value}`)
    .join(';')

export default function SanityImage({
  image,
  alt,
  aspect,
  fill,
  width,
  height,
  preload,
  deferred,
  quality = 75,
  sizes = '100vw',
  className = '',
  style,
  loading,
  ...props
}: Props) {
  const dims = image.asset.metadata?.dimensions
  const sourceWidth = dims?.width ?? 1920
  const ratio = aspect ?? dims?.aspectRatio ?? 1.5

  const url = (w: number) => {
    const b = urlFor(image).width(w).quality(quality).auto('format')
    return (aspect ? b.height(Math.round(w / aspect)).fit('crop') : b.fit('max')).url()
  }

  // Retina screens need up to 2x the rendered width, never more than the source
  const maxWidth = Math.min(sourceWidth, width ? width * 2 : sourceWidth)
  const widths = [...WIDTHS.filter((w) => w < maxWidth), maxWidth]
  const srcSet = widths.map((w) => `${url(w)} ${w}w`).join(', ')
  const src = url(widths[Math.min(widths.length - 1, 3)])

  if (preload) preloadResource(src, { as: 'image', imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: 'high' })

  const intrinsicWidth = width ?? sourceWidth
  const lqip = image.asset.metadata?.lqip
  const altText = alt ?? image.alt ?? ''

  if (deferred && fill && !preload) {
    const classes = `absolute inset-0 size-full ${className}`
    const fallback = `<img src="${escapeAttr(src)}" srcset="${escapeAttr(srcSet)}" sizes="${escapeAttr(sizes)}" alt="${escapeAttr(altText)}" class="${escapeAttr(classes)}" style="${escapeAttr(cssText(style))}" decoding="async">`
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- srcset comes straight from the Sanity CDN */}
        <img
          {...props}
          data-src={src}
          data-srcset={srcSet}
          sizes={sizes}
          alt={altText}
          decoding="async"
          className={classes}
          style={lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: 'cover', ...style } : style}
        />
        {/* Same photo over the placeholder when JavaScript is off */}
        <noscript dangerouslySetInnerHTML={{ __html: fallback }} />
      </>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- srcset comes straight from the Sanity CDN
    <img
      {...props}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={altText}
      width={fill ? undefined : intrinsicWidth}
      height={fill ? undefined : (height ?? Math.round(intrinsicWidth / ratio))}
      loading={preload ? 'eager' : (loading ?? 'lazy')}
      fetchPriority={preload ? 'high' : undefined}
      // The preloaded (LCP) image decodes normally so its paint isn't deferred; everything else decodes off the main thread
      decoding={preload ? undefined : 'async'}
      className={`${fill ? 'absolute inset-0 size-full' : ''} ${className}`}
      style={lqip && !preload ? { backgroundImage: `url(${lqip})`, backgroundSize: 'cover', ...style } : style}
    />
  )
}
