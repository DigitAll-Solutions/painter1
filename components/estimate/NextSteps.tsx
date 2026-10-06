import { House, MailCheck, Phone } from 'lucide-react'

const ICONS = [Phone, MailCheck, House]

// "What happens next" box on the email step and the success screen
export default function NextSteps({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <p className="text-sm font-bold tracking-[0.12em] text-ink uppercase">{title}</p>
      <ol className="mt-3 space-y-3">
        {items.map((item, i) => {
          const Icon = ICONS[i] ?? Phone
          return (
            <li key={item} className="flex items-start gap-3 text-slate-700">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue-text">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="pt-1">{item}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
