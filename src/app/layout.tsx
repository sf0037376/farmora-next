import './globals.css';
import { LanguageProvider } from './i18n/LanguageContext';

export const metadata = {
  title: 'Farmora AgriTech | Making Agriculture India\'s Easiest Business to Start',
  description: 'Farmora is a modern agricultural ecosystem bridging rural innovation, Polam AI, land marketplaces, gamified farming education, and Moringa exports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
