import Studio from '@/components/studio';
export default async function Page({ params }: { params: Promise<{ segments?: string[] }> }) { const { segments = [] } = await params; return <Studio segments={segments} />; }
