import {useState} from 'react'
import {Box} from '@sanity/ui'
import {ExternalLink} from 'lucide-react'
import type {DocumentActionComponent} from 'sanity'

import {PageLinks} from '../components/PageLinks'
import {useSiteData} from '../components/useSiteData'
import {pagesForDocument} from '../lib/live-pages'

/** Types that feed site pages; the corporate singletons get a disabled action until their pages exist */
export const OPEN_PAGE_TYPES = new Set(['location', 'service', 'privacyPolicy', 'warrantyTerms', 'estimateSurvey', 'franchisePage', 'locationsPage', 'franchiseOpportunities'])

/** "Open page": the published page(s) this document feeds, on the Studio's own origin */
export const OpenPageAction: DocumentActionComponent = ({type, published}) => {
  const [open, setOpen] = useState(false)
  const site = useSiteData()
  const pages = site ? pagesForDocument(type, published as Parameters<typeof pagesForDocument>[1], site.locations, site.services) : null
  const none = !published || (pages !== null && pages.length === 0)

  return {
    label: 'Open page',
    icon: ExternalLink,
    disabled: none,
    title: !published ? 'Publish first: there is no live page yet' : none ? 'No page on the site uses this yet' : 'Open the live page',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'popover',
      onHandle: () => setOpen(false),
      onClose: () => setOpen(false),
      content: (
        <Box padding={2} style={{minWidth: 280, maxHeight: '60vh', overflow: 'auto'}}>
          <PageLinks pages={pages} empty="No page yet." />
        </Box>
      ),
    },
  }
}
