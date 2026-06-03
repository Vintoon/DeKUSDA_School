import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* SEO — primary site name used by Google for sitelinks */}
        <meta name="application-name" content="In Light of the Word" />
        <meta name="keywords" content="In Light of the Word, in light of the word, DeKUSDA, church publications, Christian devotionals, sermons, Bible studies, SDA ministry" />
        {/* Google Search Console */}
        <meta name="google-site-verification" content="ZTYgxzXdvhEvNIBfSjKPB-ILJDUPq6br-cUkCPy4uGo" />
        {/* Open Graph defaults — individual pages override */}
        <meta property="og:site_name" content="In Light of the Word" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@inlightoftheword" />
        {/* PWA / mobile */}
        <meta name="theme-color" content="#1e3a8a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="In Light of the Word" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
