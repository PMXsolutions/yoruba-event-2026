export type UploadResult={message:string;stop?:boolean};
/** Retrying identical bytes is safe: the server deduplicates the sanitised content hash. */
export async function uploadWithRetry(file:File,headers:Record<string,string>,notice:(message:string)=>void,send:typeof fetch=fetch,wait:(ms:number)=>Promise<void>=ms=>new Promise(resolve=>setTimeout(resolve,ms))):Promise<UploadResult>{
 for(let attempt=0;attempt<5;attempt++){
  let response:Response;
  try{response=await send('/api/gallery/upload',{method:'POST',headers,body:file,signal:AbortSignal.timeout(120000)});}catch{
   if(attempt===4)return {message:'Connection interrupted. Reopen the private link and select these files again; received photos will be skipped.',stop:true};
   notice('Connection interrupted. Retrying this photo…');await wait(3000*(attempt+1));continue;
  }
  const result=await response.json().catch(()=>({error:'The server is temporarily unavailable.'}));
  if(response.status===429||response.status>=500){
   if(attempt===4)return {message:'Upload paused. Please try this batch again shortly; received photos will be skipped.',stop:true};
   const seconds=response.status===429?Math.min(120,Math.max(1,Number(response.headers.get('Retry-After'))||60)):5*(attempt+1);
   notice(`Pausing for ${seconds} seconds, then continuing automatically…`);await wait(seconds*1000);continue;
  }
  const message=String(result.message||result.error||'Upload could not be completed.');
  return {message,stop:response.status===403||/allowance reached|storage limit|expired|revoked/i.test(message)};
 }
 return {message:'Upload paused. Please try again.',stop:true};
}
