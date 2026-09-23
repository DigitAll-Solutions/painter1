'use client'

import Image, { type ImageProps } from 'next/image'

import { urlFor } from '@/sanity/lib/image'
import type { SanityImage as SanityImageType } from '@/sanity/lib/types'

type Props = Omit<ImageProps, 'src' | 'alt' | 'loader'> & {
  image: SanityImageType
  alt?: string
  /** width / height; when set, the image is cropped around its hotspot */
  aspect?: number
}

export default function SanityImage({ image, alt, aspect, fill, width, height, ...props }: Props) {
  const dims = image.asset.metadata?.dimensions
  const lqip = image.asset.metadata?.lqip

  const loader: ImageProps['loader'] = ({ width: w, quality }) => {
    let b = urlFor(image).width(w).quality(quality ?? 75).auto('format')
    b = aspect ? b.height(Math.round(w / aspect)).fit('crop') : b.fit('max')
    return b.url()
  }

  const sizeProps = fill
    ? { fill: true }
    : {
        width: width ?? dims?.width ?? 1200,
        height: height ?? (aspect && dims ? Math.round(dims.width / aspect) : (dims?.height ?? 800)),
      }

  return (
    <Image
      {...props}
      {...sizeProps}
      src={image.asset._id}
      alt={alt ?? image.alt ?? ''}
      loader={loader}
      placeholder={lqip ? 'blur' : 'empty'}
      blurDataURL={lqip}
    />
  )
}
