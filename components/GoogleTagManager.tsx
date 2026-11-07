import Script from 'next/script'

// One container per page: the location's own (Studio "GTM container ID") or NEXT_PUBLIC_GTM_ID, resolved
// and validated by locationGtmId (lib/gtm.ts). GTM-PVDK2ZFJ also loads Attributer.
// The container pulls in GA4, Facebook, Ads and Attributer (~650 KB of scripts), so it loads once the page
// has finished loading and the browser is idle (lazyOnload), never during the page's own load. Attributer
// still fills the survey's channel fields long before anyone can submit it (tested with a real submit).
export default function GoogleTagManager({ id }: { id: string }) {
  return (
    <>
      <Script id="gtm" strategy="lazyOnload">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
      </Script>
      <noscript>
        <iframe src={`https://www.googletagmanager.com/ns.html?id=${id}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} title="Google Tag Manager" />
      </noscript>
    </>
  )
}
