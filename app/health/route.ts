export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() { const release = process.env.MEDIA_FACTORY_RELEASE_SHA || process.env.RELEASE_SHA || ''; const valid = /^[a-f0-9]{40}$/.test(release); return Response.json({ status: valid ? 'ok' : 'unavailable', product: 'media-factory', release_sha: release, deployment_class: process.env.MEDIA_FACTORY_DEPLOYMENT_CLASS || process.env.DEPLOYMENT_CLASS || 'development' }, { status: valid ? 200 : 503 }); }
