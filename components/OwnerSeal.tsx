import SanityImage from './SanityImage'
import type { SanityImage as SanityImageType } from '@/sanity/lib/types'

type Props = { photo: SanityImageType; ownerName: string; businessName: string }

// Round badge: owner photo inside a ring of text, in the spirit of a brand seal.
export default function OwnerSeal({ photo, ownerName, businessName }: Props) {
  const ring = `${ownerName} · Owner · ${businessName} · `.toUpperCase()

  return (
    <div className="relative size-32 shrink-0 rounded-full bg-ink shadow-xl ring-4 ring-white/90 md:size-40">
      <svg viewBox="0 0 160 160" className="absolute inset-0 size-full animate-[spin_40s_linear_infinite] motion-reduce:animate-none" aria-hidden>
        <defs>
          <path id="seal-ring" d="M80,80 m-64,0 a64,64 0 1,1 128,0 a64,64 0 1,1 -128,0" />
        </defs>
        <text className="fill-white text-[11.5px] font-extrabold tracking-[0.18em]">
          <textPath href="#seal-ring" textLength="398" lengthAdjust="spacingAndGlyphs">
            {ring}
          </textPath>
        </text>
      </svg>
      <SanityImage
        image={photo}
        alt={`${ownerName}, owner of ${businessName}`}
        aspect={1}
        width={96}
        height={96}
        sizes="96px"
        loading="eager"
        className="absolute inset-[22%] size-[56%] rounded-full border-2 border-white object-cover"
      />
    </div>
  )
}
