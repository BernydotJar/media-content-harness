import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Studio from '@/components/studio';
import socialImage from '@/assets/media-factory-og.png';
import { pageInfo, pageMetadata } from '@/server/site-metadata.mjs';
import { getService } from '@/server/singleton.mjs';
export const dynamic='force-dynamic';
type Props={params:Promise<{segments?:string[]}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {segments=[]}=await params;return pageMetadata(segments,process.env,socialImage.src) as Metadata;}
export default async function Page({ params }:Props) { const { segments = [] } = await params; if(!pageInfo(segments))notFound();let googleAvailable=false;if(segments[0]==='login'){try{googleAvailable=(await getService().googleAuthConfig()).available===true}catch{googleAvailable=false}}return <Studio segments={segments} googleAvailable={googleAvailable} />; }
