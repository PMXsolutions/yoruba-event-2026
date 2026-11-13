import {prepareMedia,VIDEO_LIMIT} from '@/lib/gallery/policy';
import {usableLink,saveMedia} from '@/lib/gallery/store';
import {checkRateLimit} from '@/lib/security/rate-limit';
export const runtime='nodejs';
export async function POST(request:Request){
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(!await usableLink(token))return Response.json({error:'This link has expired or is unavailable. Ask the organiser for a new link.'},{status:403});
 if(!checkRateLimit(`gallery:${token}`,30,60000).allowed)return Response.json({error:'Please wait a minute before uploading more.'},{status:429});
 try{
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Select a file.'},{status:400});
 const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>VIDEO_LIMIT){await reader.cancel();return Response.json({error:'File exceeds 20 MB.'},{status:413});}chunks.push(value);}
 const title=decodeURIComponent(request.headers.get('x-gallery-title')||'').trim();
 const collection=decodeURIComponent(request.headers.get('x-gallery-collection')||'Yoruba Day 2026').trim();
 if(!title||title.length>160||!collection||collection.length>80||request.headers.get('x-gallery-consent')!=='yes')return Response.json({error:'Add a title and confirm permission to share.'},{status:400});
 const media=prepareMedia(Buffer.concat(chunks));const outcome=await saveMedia(token,title,collection,media);
 return Response.json({message:outcome==='duplicate'?'This file is already in the gallery queue.':'Uploaded privately. Awaiting approval.',outcome});
 }catch(e){const message=e instanceof Error?e.message:'';const safe=/^(Use |Choose |Photos |Invalid |Export |Upload |Gallery |This upload)/.test(message);return Response.json({error:safe?message:'Upload failed. Please retry; duplicate files will not be added.'},{status:400});}
}
