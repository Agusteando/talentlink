import { Inter, Outfit } from "next/font/google"; // Import Outfit for headings
import "./globals.css"; 
import { SessionProvider } from "next-auth/react";
import ToasterProvider from "@/components/ui/ToasterProvider"; 
import GoogleTranslate from "@/components/ui/GoogleTranslate";

// Friendly, rounded sans-serif for headings
const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
});

// Clean, structured sans-serif for body text
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: "TalentLink | IECS-IEDIS",
  description: "Plataforma de Reclutamiento Institucional",
  icons: {
    icon: "https://casitaiedis.edu.mx/img/IMAGOTIPO-IECS-IEDIS-23.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-sans bg-mesh-gradient min-h-screen text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
        <SessionProvider>
          <ToasterProvider />
          <GoogleTranslate />
          
          {/* Decorative background blobs for that "soft educational" feel */}
          <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-50 pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
             <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-emerald-100/40 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
             <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-indigo-50/40 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
          </div>

          {children}
        </SessionProvider>
      </body>
    </html>
  );
}