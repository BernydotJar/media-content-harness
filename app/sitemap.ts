import type { MetadataRoute } from 'next';
import { sitemapMetadata } from '@/server/site-metadata.mjs';
export const dynamic='force-dynamic';
export default function sitemap():MetadataRoute.Sitemap{return sitemapMetadata();}
