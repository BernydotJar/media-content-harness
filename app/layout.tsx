import type { Metadata } from 'next';
import { publicOrigin } from '@/server/site-metadata.mjs';
import './globals.css';
export function generateMetadata():Metadata {const origin=publicOrigin();return { ...(origin?{metadataBase:new URL(origin)}:{}),applicationName:'Media Factory',title:{default:'Media Factory — Tu estudio de contenido',template:'%s · Media Factory'},description:'De una idea a una semana de historias. Estudio de producción con fuentes autorizadas y revisión humana.',icons:{icon:[{url:'/favicon.ico',type:'image/x-icon'},{url:'/icon.png',type:'image/png',sizes:'512x512'}],apple:[{url:'/apple-icon.png',type:'image/png',sizes:'180x180'}]},robots:{index:false,follow:false,noarchive:true} };}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
