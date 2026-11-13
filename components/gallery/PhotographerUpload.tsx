'use client';
import {useEffect,useState} from 'react';
export function PhotographerUpload(){const [token,setToken]=useState(''),[busy,setBusy]=useState(false),[results,setResults]=useState<string[]>([]);
// Initial browser-only secret capture; never rendered by the server or stored persistently.
// eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(()=>{setToken(location.hash.slice(1));history.replaceState(null,'',location.pathname);},[]);
return <form className="space-y-6" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);const files=data.getAll('files') as File[];setBusy(true);setResults([]);for(const file of files){try{const response=await fetch('/api/gallery/upload',{method:'POST',headers:{Authorization:`Bearer ${token}`,'x-gallery-title':encodeURIComponent(String(data.get('title')||file.name.replace(/\.[^.]+$/,''))),'x-gallery-collection':encodeURIComponent(String(data.get('collection'))),'x-gallery-consent':'yes'},body:file});const result=await response.json();setResults(r=>[...r,`${file.name}: ${result.message||result.error}`]);}catch{setResults(r=>[...r,`${file.name}: Upload interrupted. Retry safely.`]);}}setBusy(false);}}>
<p className="text-cream/75">Share the moments. We’ll take care of the finishing touches. Every upload is private until the event team approves it.</p>
{!token&&<p role="alert" className="text-gold">Open the complete private link supplied by the organiser. If you refreshed this page, open that link again.</p>}
<label className="block">Collection<select name="collection" className="mt-2 block w-full rounded-xl bg-white p-3 text-black"><option>Yoruba Day 2026</option><option>Previous celebrations</option></select></label>
<label className="block">Caption (optional)<input name="title" maxLength={160} className="mt-2 block w-full rounded-xl bg-white p-3 text-black" placeholder="A moment worth remembering"/></label>
<label className="block">Photos or short videos<input name="files" type="file" accept="image/jpeg,image/png,video/mp4" multiple required className="mt-2 block w-full rounded-xl border border-gold/30 p-4"/></label>
<p className="text-sm text-cream/70">JPEG / PNG up to 8 MB each. MP4 up to 20 MB and 60 seconds. Up to 100 files / 250 MB per link. Photo location metadata is removed. Please remove location information from videos before uploading.</p>
<label className="flex gap-3"><input required type="checkbox" className="h-5 w-5 shrink-0"/>I have permission to share these images and videos for the event gallery, including permission for identifiable children where required.</label>
<button disabled={busy||!token} className="rounded-full bg-gold px-8 py-4 font-semibold text-espresso disabled:opacity-50">{busy?'Uploading…':'Upload for approval'}</button>
<div role="status" className="space-y-2">{results.map((r,i)=><p key={i}>{r}</p>)}</div></form>;}
