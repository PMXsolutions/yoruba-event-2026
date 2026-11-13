import { z } from "zod";
import { getAuthUser } from "@/lib/auth/rbac";
import { dbExec, dbQuery } from "@/lib/db/query";
import { CAMPAIGN } from "@/platform/engines/notifications/daily/policy";
export async function GET() {
 if((await getAuthUser())?.role!=="SUPER_ADMIN") return Response.json({error:"Forbidden"},{status:403});
 return Response.json(await dbQuery(`SELECT email FROM committee_report_copies WHERE event_slug=@slug`,{slug:CAMPAIGN}));
}
export async function POST(request:Request) {
 if((await getAuthUser())?.role!=="SUPER_ADMIN" || !["https://yorubaassociationact.org","https://yorubadaycanberra.com"].includes(request.headers.get("origin")||"")) return Response.json({error:"Forbidden"},{status:403});
 const parsed=z.object({email:z.email()}).safeParse(await request.json().catch(()=>null));
 if(!parsed.success) return Response.json({error:"Valid email required"},{status:400});
 const email=parsed.data.email.trim().toLowerCase();
 await dbExec(`IF NOT EXISTS(SELECT 1 FROM committee_report_copies WHERE event_slug=@slug AND email=@email) INSERT INTO committee_report_copies(event_slug,email) VALUES(@slug,@email)`,{slug:CAMPAIGN,email});
 return Response.json({saved:true,email,portalAccessGranted:false});
}
