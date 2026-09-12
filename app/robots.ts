import type { MetadataRoute } from 'next';
import { robotsMetadata } from '@/server/site-metadata.mjs';
export const dynamic='force-dynamic';
export default function robots():MetadataRoute.Robots{return robotsMetadata();}
