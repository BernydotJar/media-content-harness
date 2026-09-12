import { llmsText } from '@/server/site-metadata.mjs';
export const dynamic='force-dynamic';
export function GET(){return new Response(llmsText(),{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'public, max-age=300','x-content-type-options':'nosniff','x-robots-tag':'noindex'}});}
