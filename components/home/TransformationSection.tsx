import TransformationBlock from '../TransformationBlock'
import type { Location } from '@/sanity/lib/types'

const DEFAULT_BODY =
  'Renew your home with expert painting from a team you can watch work. Drag the slider to see a real [City] project, start to finish — prep, protection, and a professional on-site the whole way through. Start with a free estimate, then a color consultation, then a scheduled job that works around your life — not the other way around.'

export default function TransformationSection({ location }: { location: Location }) {
  const before = location.transformationBeforeImage
  const after = location.transformationAfterImage
  if (!before || !after) return null

  const city = location.address?.city ?? location.name
  const body = (location.transformationBody || DEFAULT_BODY).replace(/\[city\]/gi, city)

  return <TransformationBlock before={before} after={after} heading="Our Painting Services in Action" body={body} />
}
