import {requireAuth} from '@/lib/auth/rbac';
import {createLink,revokeLink,reviewMedia,reviewMediaBatch} from '@/lib/gallery/store';
import {z} from 'zod';
export async function POST(request:Request){
 const auth=await requireAuth('settings.write');if(!auth.ok)return Response.json({error:'Administrator access required.'},{status:403});
 const origin=request.headers.get('origin');const host=request.headers.get('x-forwarded-host')||request.headers.get('host');
 if(!origin||new URL(origin).host!==host)return Response.json({error:'Invalid request origin.'},{status:403});
 try{const body=await request.json();if(body.action==='create'){const label=z.string().trim().min(2).max(120).parse(body.label);return Response.json({token:await createLink(label,auth.user.id)});}
 if(body.action==='review-batch'){const ids=[...new Set(z.array(z.string().guid()).min(1).max(1000).parse(body.ids))];const status=z.enum(['pending','approved','rejected']).parse(body.status);const count=await reviewMediaBatch(ids,status,auth.user.id);return Response.json({ok:true,count});}
 const id=z.string().guid().parse(body.id);if(body.action==='revoke'){await revokeLink(id);return Response.json({ok:true});}
 const status=z.enum(['pending','approved','rejected']).parse(body.status);if(body.action!=='review')throw new Error('Invalid action');const count=await reviewMedia(id,status,auth.user.id);return Response.json({ok:count>0});
 }catch{return Response.json({error:'Unable to save. Refresh and try again.'},{status:400});}
}
