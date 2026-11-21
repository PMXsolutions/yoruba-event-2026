"use client";
import {useState} from "react";
import {seatingReport,sendSeatingBooking} from "@/app/actions/seating";
type Row=Awaited<ReturnType<typeof seatingReport>>[number];
export function SeatingDispatch({initial}:{initial:Row[]}) {
 const [rows,setRows]=useState(initial),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function run() {
  setBusy(true);
  try {
   for(const r of rows.filter(r=>r.valid&&(!r.assigned||r.branded==='waiting'))) {
    setMessage(`Sending seating details to ${r.name}…`);
    const result=await sendSeatingBooking(r.id,true);
    setRows(await seatingReport());
    if(result.issues.length) {setMessage(`${r.name}: ${result.issues.join('; ')}. Sending paused.`);return;}
   }
   setRows(await seatingReport());setMessage("Run finished. Sent means accepted by the email/SMS provider, not proof of receipt. Review any exceptions below. Previously attempted messages are never automatically repeated.");
  } catch(e) {setMessage(`Paused: ${e instanceof Error?e.message:'Unexpected error'}. Reload to review recorded sends before continuing.`);}
  finally {setBusy(false);}
 }
 return <section style={{padding:24,background:'#faf6ef',color:'#24150f'}}>
 <h1 className="text-2xl font-bold">Seating confirmations — 21 November</h1>
 <p>Approved plan: 34 tables, 8 chairs each; tables 1–3 reserved. Tables 28 and 34 are neighbours.</p>
 <p className="my-4 font-semibold">{rows.length} bookings · {rows.reduce((n,r)=>n+r.guests,0)} guests · Email sent: {rows.filter(r=>r.email==='sent').length} · Branded replacement emails: {rows.filter(r=>r.branded==='sent').length} · SMS sent: {rows.filter(r=>r.sms==='sent').length} · Assignments saved: {rows.filter(r=>r.assigned).length} · Both sent: {rows.filter(r=>r.email==='sent'&&r.sms==='sent').length}</p>
 <p>Each booking lead receives their total guest count and table allocation. Guests arriving separately give the lead&apos;s name to ushers. Consent is respected; unassigned or changed bookings are held.</p>
 <button className="my-4 rounded bg-amber-800 px-5 py-3 text-white disabled:opacity-50" disabled={busy} onClick={run}>{busy?'Sending…':'Send remaining branded seating emails'}</button>
 <p role="status">{message}</p>
 <table className="mt-4 w-full text-sm"><thead><tr>{['Booking','Guests','Table (guests)','Original email','Branded email','SMS','Contacted / review'].map(h=><th className="p-2 text-left" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t"><td className="p-2">{r.name}</td><td>{r.guests}</td><td>{r.tables}</td><td>{r.email}{r.emailDetail?`: ${r.emailDetail}`:''}</td><td>{r.branded}</td><td>{r.sms}{r.smsDetail?`: ${r.smsDetail}`:''}</td><td>{r.hold??(r.contacted?'Contacted':'Not marked contacted')}</td></tr>)}</tbody></table>
 </section>;
}
