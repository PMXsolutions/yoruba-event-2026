import { getAuthUser, hasPermission } from "@/lib/auth/rbac";
import { validCronSignature, RELEASE, schedule } from "@/platform/engines/notifications/daily/policy";
import { runDailyCommunications, deliveryStatus } from "@/platform/engines/notifications/daily/runner";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function admin() {const user=await getAuthUser();return user && hasPermission(user,"settings.write");}
export async function GET() {
  if(!await admin()) return Response.json({error:"Forbidden"},{status:403});
  return Response.json({release:RELEASE,schedule:schedule(),deliveries:await deliveryStatus(),attendeeTime:"10:00 Australia/Sydney",committeeTime:"18:00 Australia/Sydney",stop:"21 November 2026 after final committee report",enabled:process.env.DAILY_COMMUNICATIONS_ENABLED!=="false"});
}
export async function POST(request:Request) {
  const signed=validCronSignature(request.headers.get("x-comms-time"),request.headers.get("x-comms-signature"),process.env.SESSION_SECRET);
  if(!signed) {
    const origin=request.headers.get("origin");
    if(!origin || !["https://yorubaassociationact.org","https://yorubadaycanberra.com"].includes(origin) || !await admin()) return Response.json({error:"Forbidden"},{status:403});
  }
  try {
    const dryRun=new URL(request.url).searchParams.get("preview")==="1";
    return Response.json(await runDailyCommunications(new Date(),dryRun));
  } catch {return Response.json({error:"Communication run failed; inspect server logs"},{status:500});}
}
