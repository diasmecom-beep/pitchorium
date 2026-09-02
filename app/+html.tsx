import { ScrollViewStyleReset } from 'expo-router/html';

// Personnalise le document HTML racine généré par Expo Router pour le web.
// `viewport-fit=cover` + les unités de hauteur dynamique (voir web/root.css injecté ci-dessous)
// évitent que la barre d'outils du bas et le menu soient masqués par la barre d'adresse mobile
// tant que l'utilisateur n'a pas fait défiler la page.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveStyle }} />
        <script dangerouslySetInnerHTML={{ __html: fontRejectionGuard }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveStyle = `
html, body, #root {
  height: 100%;
  height: -webkit-fill-available;
  height: 100dvh;
  overscroll-behavior-y: none;
}
body {
  overflow: hidden;
}
`;

// expo-font's web loader races a hardcoded 12s timeout against the browser's font-ready
// detection; on a slow/backgrounded tab it can reject after the icon has already rendered
// fine, and that rejection isn't caught inside @expo/vector-icons — it would otherwise surface
// as an unhandled promise rejection (a scary dev overlay, or a silent crash risk in prod).
// The icon itself is unaffected either way, so this only prevents that specific noise.
const fontRejectionGuard = `
window.addEventListener('unhandledrejection', function (event) {
  var msg = event && event.reason && (event.reason.message || String(event.reason));
  if (msg && msg.indexOf('timeout exceeded') !== -1) {
    event.preventDefault();
  }
});
`;
