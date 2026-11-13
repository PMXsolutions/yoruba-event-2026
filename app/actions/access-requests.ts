"use server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { dbQuery, dbTransaction } from "@/lib/db/query";
import { requireAuth } from "@/lib/auth/rbac";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { issueAccountEmail } from "@/lib/auth/account-email";
const schema=z.object({name:z.string().trim().min(2).max(120),email:z.string().trim().toLowerCase().email().max(254),workstream:z.string().trim().min(2).max(200),website:z.string().max(0)});
export async function requestCommitteeAccess(raw:unknown) {
 const p=schema.safeParse(raw); if(!p.success)return {ok:false,message:"Please enter your name, a valid email and your committee role or workstream."};
 const h=await headers(); const ip=h.get("x-forwarded-for")?.split(",")[0]||"unknown";
 if(!checkRateLimit(`access-ip:${ip}`,10,3600000).allowed||!checkRateLimit(`access-email:${p.data.email}`,3,3600000).allowed)return {ok:false,message:"Please wait before submitting another request."};
 try { await dbTransaction(async q=> { await q(`IF NOT EXISTS (SELECT 1 FROM committee_access_requests WITH (UPDLOCK,HOLDLOCK) WHERE email=@email) INSERT INTO committee_access_requests(id,full_name,email,workstream,status) VALUES(@id,@name,@email,@workstream,N'pending')`,{id:randomUUID(),name:p.data.name,email:p.data.email,workstream:p.data.workstream}); }); }
 catch {return {ok:false,message:"Your request could not be saved. Please try again."};}
 revalidatePath("/dashboard/members");return {ok:true,message:"Thank you. Your request has been received for review. This does not grant portal access. If approved, you will receive an email to set your password. Existing members can use Sign in or Reset password."};
}
export async function listAccessRequests(){const a=await requireAuth("user.manage");if(!a.ok)return [];return dbQuery<{id:string;full_name:string;email:string;workstream:string;status:string}>(`SELECT id,full_name,email,workstream,status FROM committee_access_requests ORDER BY created_at DESC`);}
export async function reviewAccessRequest(id:string,decision:"approve"|"decline"){
 const a=await requireAuth("user.manage");if(!a.ok)return {ok:false,message:"Only a Super Admin can review requests."};
 if(!z.string().uuid().safeParse(id).success||!["approve","decline"].includes(decision))return {ok:false,message:"Invalid request."};
 let recipient:{id:string;email:string}|undefined;
 try {await dbTransaction(async q=>{
 const actors=await q(`SELECT id FROM profiles WITH (UPDLOCK,HOLDLOCK) WHERE id=@actor AND is_active=1 AND role=N'SUPER_ADMIN'`,{actor:a.user.id});if(!actors.length)throw Error("denied");
 const rows=await q<{full_name:string;email:string}>(`SELECT full_name,email FROM committee_access_requests WITH (UPDLOCK,HOLDLOCK) WHERE id=@id AND status=N'pending'`,{id});if(!rows.length)throw Error("Already reviewed");
 const r=rows[0];
 if(decision==="approve"){
 const existing=await q(`SELECT id FROM profiles WITH (UPDLOCK,HOLDLOCK) WHERE email=@email`,{email:r.email});if(existing.length)throw Error("An account already exists. Review it in Members; this request will not change existing access.");
 const profileId=randomUUID();await q(`INSERT INTO profiles(id,email,full_name,role,is_active) VALUES(@id,@email,@name,N'COMMITTEE',1)`,{id:profileId,email:r.email,name:r.full_name});recipient={id:profileId,email:r.email};
 }
 await q(`UPDATE committee_access_requests SET status=@status,reviewed_by=@actor,reviewed_at=SYSDATETIMEOFFSET() WHERE id=@id`,{id,status:decision==="approve"?"approved":"declined",actor:a.user.id});
 await q(`INSERT INTO activity_logs(event_slug,action,entity_type,entity_id,actor_id) VALUES(N'yoruba-day-canberra-2026',@action,N'member',@id,@actor)`,{action:`member.request_${decision}`,id,actor:a.user.id});
 });}catch(e){return {ok:false,message:e instanceof Error&&e.message.startsWith("An account")?e.message:"Request could not be reviewed or has already been reviewed. Refresh and try again."};}
 revalidatePath("/dashboard/members");
 if(recipient){try{const mail=await issueAccountEmail({profileId:recipient.id,email:recipient.email,purpose:"invite",subject:"Your committee access is approved — Yoruba Day Canberra",intro:"Your committee access request has been approved. Use the secure link below to set your password."});return {ok:true,message:mail.ok?"Approved. Setup email accepted by the mail server.":"Approved, but email failed. Use Resend setup email in Members."};}catch{return {ok:true,message:"Approved, but email failed. Use Resend setup email in Members."};}}
 return {ok:true,message:"Request declined. No access granted."};
}
