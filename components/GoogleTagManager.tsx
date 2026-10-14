import Script from 'next/script'

// Loaded only when NEXT_PUBLIC_GTM_ID is set (e.g. GTM-PVDK2ZFJ, which also loads Attributer).
// The container pulls in GA4, Facebook, Ads and Attributer (~650 KB of scripts), so it loads once the page
// has finished loading and the browser is idle (lazyOnload), never during the page's own load. Attributer
// still fills the survey's channel fields long before anyone can submit it (tested with a real submit).
export default function GoogleTagManager() {
  const id = process.env.NEXT_PUBLIC_GTM_ID?.trim()
  if (!id || !/^GTM-[A-Z0-9]+$/.test(id)) return null
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
