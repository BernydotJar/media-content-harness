import generateImage from '@/server/social-image';
export const dynamic='force-static';
export function GET(){return generateImage();}
