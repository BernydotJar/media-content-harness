import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Media Factory — Tu estudio de contenido', description: 'De una idea a una semana de historias. Estudio de producción con fuentes autorizadas y revisión humana.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
