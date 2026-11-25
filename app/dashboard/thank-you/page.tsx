import {thankYouReport,thankYouPreview} from '@/app/actions/thank-you';
import {ThankYouDispatch} from '@/components/dashboard/ThankYouDispatch';
export const dynamic='force-dynamic';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {redactSmtpErrorMessage} from '@/platform/engines/notifications/email/env-status';
export default async function Page(){
 const rows=await thankYouReport(); // Authentication precedes diagnostic access.
 const errors:string[]=[];
 try {const dir=path.join(process.cwd(),'logs');const entries=await fs.readdir(dir);const files=await Promise.all(entries.filter(n=>/^node.*\.log$/.test(n)).map(async n=>({name:n,stat:await fs.stat(path.join(dir,n))})));files.sort((a,b)=>b.stat.mtimeMs-a.stat.mtimeMs);for(const f of files.slice(0,3)){const h=await fs.open(path.join(dir,f.name),'r');try{const size=Math.min(f.stat.size,262144),buf=Buffer.alloc(size);await h.read(buf,0,size,f.stat.size-size);for(const line of buf.toString('utf8').split('\n'))if(line.includes('[notification-engine] SMTP send failed:'))errors.push(redactSmtpErrorMessage(line).replace(/[\w.+-]+@[\w.-]+/g,'[address]').slice(0,700));}finally{await h.close();}}}catch{errors.push('Server diagnostic logs unavailable');}
 return <><ThankYouDispatch initial={rows} preview={await thankYouPreview()}/><details><summary>Email diagnostics</summary><pre>{[...new Set(errors)].slice(-10).join('\n')||'No SMTP failure logs found'}</pre></details></>;
}
