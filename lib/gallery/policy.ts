import { createHash } from 'node:crypto';
export const PHOTO_LIMIT=8*1024*1024, VIDEO_LIMIT=20*1024*1024;
export const EVENT_LIMIT=500*1024*1024, LINK_LIMIT=250*1024*1024;
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export function validToken(token:string){return /^[a-f0-9]{64}$/.test(token);}
/** Remove JPEG EXIF/IPTC/comments without changing pixels. Reject malformed segments. */
export function prepareMedia(data:Buffer){
 if(data.length<12||data.length>VIDEO_LIMIT)throw new Error('Choose a photo up to 8 MB or an MP4 clip up to 20 MB.');
 if(data[0]===255&&data[1]===216){
  if(data.length>PHOTO_LIMIT)throw new Error('Photos must be 8 MB or smaller.');
  const parts=[data.subarray(0,2)];let p=2,foundScan=false;
  while(p<data.length){if(data[p]!==255)throw new Error('Invalid JPEG.');const marker=data[p+1];if(marker===218){parts.push(data.subarray(p));foundScan=true;break;}const n=data.readUInt16BE(p+2);if(n<2||p+2+n>data.length)throw new Error('Invalid JPEG.');if(![225,237,254].includes(marker))parts.push(data.subarray(p,p+2+n));p+=2+n;}
  if(!foundScan||data[data.length-2]!==255||data[data.length-1]!==217)throw new Error('Invalid JPEG.');
  return {data:Buffer.concat(parts),mime:'image/jpeg',kind:'photo'};
 }
 if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){
  if(data.length>PHOTO_LIMIT)throw new Error('Photos must be 8 MB or smaller.');
  const parts=[data.subarray(0,8)];let p=8,end=false;
  while(p+12<=data.length){const n=data.readUInt32BE(p),type=data.toString('ascii',p+4,p+8);if(p+n+12>data.length)throw new Error('Invalid PNG.');if(['IHDR','PLTE','IDAT','IEND','tRNS','sRGB','gAMA','cHRM'].includes(type))parts.push(data.subarray(p,p+n+12));p+=n+12;if(type==='IEND'){end=true;break;}}
  if(!end)throw new Error('Invalid PNG.');return {data:Buffer.concat(parts),mime:'image/png',kind:'photo'};
 }
 if(data.toString('ascii',4,8)==='ftyp'){
  let duration=0,hasMedia=false;
  function boxes(start:number,end:number,depth:number){if(depth>4)throw new Error('Invalid MP4.');let p=start;while(p+8<=end){const n=data.readUInt32BE(p),type=data.toString('ascii',p+4,p+8);if(n<8||p+n>end)throw new Error('Export a standard MP4 clip.');if(type==='mdat')hasMedia=true;if(type==='moov')boxes(p+8,p+n,depth+1);if(type==='mvhd'){const version=data[p+8];const offset=version===1?28:20;if(p+offset+12>p+n)throw new Error('Invalid video duration.');const scale=data.readUInt32BE(p+offset);duration=Number(version===1?data.readBigUInt64BE(p+offset+4):data.readUInt32BE(p+offset+4))/scale;}p+=n;}}
  boxes(0,data.length,0);if(!hasMedia||!Number.isFinite(duration)||duration<=0||duration>60)throw new Error('Use an MP4 clip of 60 seconds or less.');
  return {data,mime:'video/mp4',kind:'video'};
 }
 throw new Error('Use JPEG, PNG or MP4 files.');
}
