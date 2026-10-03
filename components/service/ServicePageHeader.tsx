import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type Crumb = { name: string; href?: string }

// Slim, quiet header so the page still opens on the transformation like the mockup.
export default function ServicePageHeader({ crumbs, title }: { crumbs: Crumb[]; title: string }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 md:py-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
            {crumbs.map((crumb, i) => (
              <li key={crumb.name} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3.5 text-slate-400" aria-hidden />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-ink hover:underline">
                    {crumb.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-ink">
                    {crumb.name}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-balance md:text-3xl">{title}</h1>
      </div>
    </div>
  )
}
