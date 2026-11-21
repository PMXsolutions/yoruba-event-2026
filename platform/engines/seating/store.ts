import "server-only";
import { dbExec, dbQuery, dbTransaction } from "@/lib/db/query";
export const campaign = "yoruba-seating-20261121";
let ready: Promise<void> | undefined;
export async function ensureSeatingStore() {
 ready ??= dbTransaction(async q => {
  await q(`EXEC sp_getapplock @Resource='seating-schema-v1', @LockMode='Exclusive', @LockOwner='Transaction';
IF OBJECT_ID('dbo.seating_assignments','U') IS NULL CREATE TABLE dbo.seating_assignments (
 event_slug nvarchar(120) NOT NULL, rsvp_id uniqueidentifier NOT NULL, campaign nvarchar(80) NOT NULL,
 reference nvarchar(100) NOT NULL, guest_count int NOT NULL, tables_json nvarchar(max) NOT NULL,
 saved_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(), PRIMARY KEY(event_slug,rsvp_id,campaign));
IF OBJECT_ID('dbo.seating_deliveries','U') IS NULL CREATE TABLE dbo.seating_deliveries (
 event_slug nvarchar(120) NOT NULL,rsvp_id uniqueidentifier NOT NULL,campaign nvarchar(80) NOT NULL,
 channel nvarchar(10) NOT NULL,recipient nvarchar(320) NOT NULL,content nvarchar(max) NOT NULL,
 status nvarchar(30) NOT NULL,provider_id nvarchar(500) NULL,detail nvarchar(500) NULL,
 attempted_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),sent_at datetimeoffset NULL,
 PRIMARY KEY(event_slug,rsvp_id,campaign,channel));`);
 }).catch(e=>{ready=undefined;throw e;});
 return ready;
}
export type Delivery = {rsvp_id:string;channel:string;status:string;detail:string|null;provider_id:string|null};
export async function deliveries(slug:string) {
 await ensureSeatingStore();
 return dbQuery<Delivery>(`SELECT rsvp_id,channel,status,detail,provider_id FROM dbo.seating_deliveries WHERE event_slug=@slug AND campaign=@campaign`,{slug,campaign});
}
export async function claim(slug:string,id:string,channel:string,recipient:string,content:string) {
 return dbTransaction(async q=>{
  const rows=await q<{claimed:number}>(`IF NOT EXISTS (SELECT 1 FROM dbo.seating_deliveries WITH(UPDLOCK,HOLDLOCK) WHERE event_slug=@slug AND rsvp_id=@id AND campaign=@campaign AND channel=@channel)
 BEGIN INSERT dbo.seating_deliveries(event_slug,rsvp_id,campaign,channel,recipient,content,status) VALUES(@slug,@id,@campaign,@channel,@recipient,@content,'sending'); SELECT 1 AS claimed; END ELSE SELECT 0 AS claimed;`,{slug,id,campaign,channel,recipient,content});
  return rows[0]?.claimed===1;
 });
}
export async function complete(slug:string,id:string,channel:string,ok:boolean,provider:string|null,detail:string|null) {
 await dbExec(`UPDATE dbo.seating_deliveries SET status=@status,provider_id=@provider,detail=@detail,sent_at=CASE WHEN @ok=1 THEN SYSDATETIMEOFFSET() ELSE NULL END WHERE event_slug=@slug AND rsvp_id=@id AND campaign=@campaign AND channel=@channel`,{slug,id,campaign,channel,ok,status:ok?'sent':'review_required',provider,detail});
}
