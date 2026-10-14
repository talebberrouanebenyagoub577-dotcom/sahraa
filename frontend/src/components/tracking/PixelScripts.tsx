import Script from "next/script";

function safeId(value: string | undefined): string {
  return value && /^[A-Za-z0-9_-]+$/.test(value) ? value : "";
}

export function PixelScripts() {
  const meta = safeId(process.env.NEXT_PUBLIC_META_PIXEL_ID);
  const tiktok = safeId(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);
  const snap = safeId(process.env.NEXT_PUBLIC_SNAP_PIXEL_ID);

  return (
    <>
      {meta ? (
        <Script id="sahraa-meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta}');window.__sahraaFlush&&window.__sahraaFlush();`}
        </Script>
      ) : null}
      {tiktok ? (
        <Script id="sahraa-tiktok-pixel" strategy="lazyOnload">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};ttq.load('${tiktok}')}(window,document,'ttq');window.__sahraaFlush&&window.__sahraaFlush();`}
        </Script>
      ) : null}
      {snap ? (
        <Script id="sahraa-snap-pixel" strategy="lazyOnload">
          {`(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${snap}',{});window.__sahraaFlush&&window.__sahraaFlush();`}
        </Script>
      ) : null}
    </>
  );
}
