import { handlePreview } from '@/server/host-preview.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const route = (request: Request) => handlePreview(request);
export const GET = route;
export const POST = route;
