import { headers } from "next/headers";
import { metaPixelBootstrap, runtimePixelIds } from "@/lib/tracking/pixel-id";

export async function PixelScripts() {
  await headers();
  const ids = runtimePixelIds();
  const metaSnippet = metaPixelBootstrap(ids.META);

  return (
    <>
      <script
        id="sahraa-pixel-ids"
        dangerouslySetInnerHTML={{
          __html: `window.__SAHRAA_PIXELS=${JSON.stringify(ids)};`,
        }}
      />
      {metaSnippet ? (
        <script
          id="sahraa-meta-pixel"
          dangerouslySetInnerHTML={{ __html: metaSnippet }}
        />
      ) : null}
      {ids.META ? (
        <noscript>
          <img
            height={1}
            width={1}
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${ids.META}&ev=PageView&noscript=1`}
          />
        </noscript>
      ) : null}
      {ids.TIKTOK ? (
        <script
          id="sahraa-tiktok-pixel"
          dangerouslySetInnerHTML={{
            __html: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0;a.src=r+"?sdkid="+e+"&lib="+t;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};ttq.load(${JSON.stringify(ids.TIKTOK)})}(window,document,'ttq');window.__sahraaFlush&&window.__sahraaFlush();`,
          }}
        />
      ) : null}
      {ids.SNAP ? (
        <script
          id="sahraa-snap-pixel"
          dangerouslySetInnerHTML={{
            __html: `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName('script')[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init',${JSON.stringify(ids.SNAP)},{});window.__sahraaFlush&&window.__sahraaFlush();`,
          }}
        />
      ) : null}
    </>
  );
}
