import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type Crumb = { name: string; href?: string }

// Visible breadcrumb trail; the last crumb (no href) is the current page. Text color comes from the parent.
export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <li key={crumb.name} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
            {crumb.href ? (
              <Link href={crumb.href} className="underline-offset-4 hover:underline">
                {crumb.name}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold">
                {crumb.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
