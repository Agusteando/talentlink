// --- src\app\layout.js ---
import { Inter } from "next/font/google";
import "./globals.css"; 
import { SessionProvider } from "next-auth/react";
import ToasterProvider from "@/components/ui/ToasterProvider"; 
import GoogleTranslate from "@/components/ui/GoogleTranslate";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TalentLink | IECS-IEDIS",
  description: "Plataforma de Reclutamiento Institucional",
  icons: {
    icon: "https://casitaiedis.edu.mx/img/IMAGOTIPO-IECS-IEDIS-23.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <SessionProvider>
          <ToasterProvider />
          <GoogleTranslate /> {/* Inject Translation Engine */}
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}