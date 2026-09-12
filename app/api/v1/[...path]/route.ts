import { handleApi } from '@/server/http.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Next's second argument is route context, not the injectable service argument.
const route = (request: Request) => handleApi(request);
export const GET = route;
export const POST = route;
export const PUT = route;
export const PATCH = route;
export const DELETE = route;
