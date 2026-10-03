import Section from '../Section'

export type Faq = { _key: string; question: string; answer: string }

// Every answer is visible (no accordion), matching the mockup; the page adds FAQPage JSON-LD.
export default function ServiceFaq({ faqs, title }: { faqs: Faq[]; title: string }) {
  if (!faqs.length) return null

  return (
    <Section eyebrow="Common Questions" title={title}>
      <div className="mx-auto max-w-3xl divide-y divide-slate-200 border-b border-slate-200">
        {faqs.map((faq) => (
          <div key={faq._key} className="py-6">
            <h3 className="text-lg font-bold text-ink">{faq.question}</h3>
            <p className="mt-2 leading-relaxed text-slate-600">{faq.answer}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
