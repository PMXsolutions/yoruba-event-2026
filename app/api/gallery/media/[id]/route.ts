import {dbOne} from '@/lib/db/query';
import {getActiveEventSlug} from '@/platform/core/config/active-event';
import {requireAuth} from '@/lib/auth/rbac';
import {z} from 'zod';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.string().guid().safeParse(id).success)return new Response('Not found',{status:404});
 const meta=await dbOne<{status:string}>('SELECT status FROM gallery_media WHERE id=@id AND event_slug=@event',{id,event:getActiveEventSlug()});
 if(!meta)return new Response('Not found',{status:404});
 const admin=(await requireAuth('settings.write')).ok;
 if(meta.status!=='approved'&&!admin)return new Response('Not found',{status:404});
 // Repeat visibility restriction in content query to avoid an unpublish/read race.
 const row=await dbOne<{mime:string;content:Buffer}>(`SELECT mime,content FROM gallery_media WHERE id=@id AND event_slug=@event ${admin?'':"AND status=N'approved'"}`,{id,event:getActiveEventSlug()});
 if(!row)return new Response('Not found',{status:404});
 const headers={'Content-Type':row.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Accept-Ranges':'bytes'};
 const range=request.headers.get('range');if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m)return new Response(null,{status:416});const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),row.content.length-1):row.content.length-1;if(start>end||start>=row.content.length)return new Response(null,{status:416});return new Response(new Uint8Array(row.content.subarray(start,end+1)),{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${row.content.length}`,'Content-Length':String(end-start+1)}});}
 return new Response(new Uint8Array(row.content),{headers:{...headers,'Content-Length':String(row.content.length)}});
}
