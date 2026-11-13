import 'server-only';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import sql from 'mssql';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {EXISTING_PHOTOS} from './existing';
import {prepareMedia} from './policy';
import {dbQuery,dbOne,dbExec,getPool} from '@/lib/db/query';
import {getActiveEventSlug} from '@/platform/core/config/active-event';
import {EVENT_LIMIT,LINK_LIMIT,tokenHash,validToken} from './policy';
export type GalleryItem={id:string;title:string;collection:string;kind:string;status:string;created_at:string};
export async function listMedia(review=false){return dbQuery<GalleryItem>(`SELECT id,title,collection,kind,status,created_at FROM gallery_media WHERE event_slug=@event ${review?'':"AND status=N'approved'"} ORDER BY created_at DESC`,{event:getActiveEventSlug()});}
export async function createLink(label:string,actor:string){const token=randomBytes(32).toString('hex');await dbExec('INSERT INTO gallery_links(id,event_slug,label,token_hash,expires_at,created_by) VALUES(@id,@event,@label,@hash,DATEADD(day,14,SYSDATETIMEOFFSET()),@actor)',{id:randomUUID(),event:getActiveEventSlug(),label,hash:tokenHash(token),actor});return token;}
export async function links(){return dbQuery<{id:string;label:string;expires_at:string;revoked:boolean}>('SELECT id,label,expires_at,revoked FROM gallery_links WHERE event_slug=@event ORDER BY created_at DESC',{event:getActiveEventSlug()});}
export async function usableLink(token:string){if(!validToken(token))return null;return dbOne<{id:string}>('SELECT id FROM gallery_links WHERE token_hash=@hash AND event_slug=@event AND revoked=0 AND expires_at>SYSDATETIMEOFFSET()',{hash:tokenHash(token),event:getActiveEventSlug()});}
let existingHashes:Set<string>|undefined;
function alreadyPublished(data:Buffer){if(!existingHashes)existingHashes=new Set(EXISTING_PHOTOS.map(p=>createHash('sha256').update(prepareMedia(readFileSync(path.join(process.cwd(),'public',p.src))).data).digest('hex')));return existingHashes.has(createHash('sha256').update(data).digest('hex'));}
export async function saveMedia(token:string,title:string,collection:string,media:{data:Buffer;mime:string;kind:string}){
 if(alreadyPublished(media.data))return 'duplicate';
 const transaction=new sql.Transaction(await getPool());await transaction.begin();
 try{const request=new sql.Request(transaction);request.input('hash',sql.Char(64),tokenHash(token));request.input('event',sql.NVarChar(160),getActiveEventSlug());request.input('title',sql.NVarChar(160),title);request.input('collection',sql.NVarChar(80),collection);request.input('mime',sql.NVarChar(40),media.mime);request.input('kind',sql.NVarChar(10),media.kind);request.input('size',sql.Int,media.data.length);request.input('content',sql.VarBinary(sql.MAX),media.data);request.input('digest',sql.Char(64),createHash('sha256').update(media.data).digest('hex'));request.input('id',sql.UniqueIdentifier,randomUUID());request.input('eventLimit',sql.Int,EVENT_LIMIT);request.input('linkLimit',sql.Int,LINK_LIMIT);
 const result=await request.query(`
 DECLARE @lockResult int;
 EXEC @lockResult=sp_getapplock @Resource=N'gallery-upload',@LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=10000;
 IF @lockResult<0 THROW 50000,'Upload busy. Please retry.',1;
 DECLARE @link uniqueidentifier=(SELECT id FROM gallery_links WITH(UPDLOCK,HOLDLOCK) WHERE token_hash=@hash AND event_slug=@event AND revoked=0 AND expires_at>SYSDATETIMEOFFSET());
 IF @link IS NULL THROW 50000,'This upload link has expired or been revoked.',1;
 IF EXISTS(SELECT 1 FROM gallery_media WHERE event_slug=@event AND content_hash=@digest) BEGIN SELECT N'duplicate' AS outcome; END
 ELSE BEGIN
 IF (SELECT COALESCE(SUM(CONVERT(bigint,byte_size)),0) FROM gallery_media WHERE event_slug=@event)+@size>@eventLimit THROW 50000,'Gallery storage limit reached. Contact the organiser.',1;
 IF (SELECT COALESCE(SUM(CONVERT(bigint,byte_size)),0) FROM gallery_media WHERE link_id=@link)+@size>@linkLimit OR (SELECT COUNT(*) FROM gallery_media WHERE link_id=@link)>=100 THROW 50000,'Upload allowance reached. Contact the organiser.',1;
 INSERT INTO gallery_media(id,event_slug,link_id,title,collection,mime,kind,content_hash,content,byte_size) VALUES(@id,@event,@link,@title,@collection,@mime,@kind,@digest,@content,@size);
 SELECT N'pending' AS outcome;
 END`);await transaction.commit();return result.recordset[0].outcome as string;
 }catch(e){await transaction.rollback();throw e;}
}
export async function reviewMedia(id:string,status:string,actor:string){return dbExec('UPDATE gallery_media SET status=@status,reviewed_by=@actor,reviewed_at=SYSDATETIMEOFFSET() WHERE id=@id AND event_slug=@event',{id,status,actor,event:getActiveEventSlug()});}
export async function revokeLink(id:string){return dbExec('UPDATE gallery_links SET revoked=1 WHERE id=@id AND event_slug=@event',{id,event:getActiveEventSlug()});}
