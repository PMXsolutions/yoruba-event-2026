export type Assignment = { name: string; ref: string; size: number; allocations: {table:number;guests:number}[] };
export function tableLabel(a: Assignment) {
  return a.allocations.map(x => `${String(x.table).padStart(2,"0")} (${x.guests} guest${x.guests===1?"":"s"})`).join(" and ");
}
export function seatingSms(a: Assignment) {
  return `Yoruba Day seating confirmed for ${a.name}: ${a.size} guests. Ref: ${a.ref}. Table${a.allocations.length>1?"s":""} ${tableLabel(a)}. Sat 21 Nov, 3pm, Fitzroy Hall, Exhibition Park Canberra. Please share with your guests; arriving separately, give ushers your booking name. I look forward to welcoming you! Joshua`;
}
const escape = (s:string) => s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export function seatingEmail(a: Assignment) {
 const text = `Hello ${a.name},\n\nYour Yoruba Day seating is confirmed for ${a.size} guests in total.\n\nTable${a.allocations.length>1?"s":""}: ${tableLabel(a)}\nBooking reference: ${a.ref}\n\nSaturday 21 November 2026, 3pm\nFitzroy Hall, Exhibition Park, Canberra\n\nPlease share these details with everyone in your booking. If you arrive separately, each guest can give the ushers your booking name; the ushers will mark each arrival individually. ${a.allocations.length>1?"Your group is across neighbouring tables, with the guest numbers shown above. ":""}Please sit at the numbered table shown in this confirmation.\n\nAttire: white, white and blue, or blue.\n\nI look forward to welcoming you and your guests!\n\nJoshua\nYoruba Association in the ACT\nhttps://yorubaassociationact.org/`;
 return {subject:`Your Yoruba Day seating: Table${a.allocations.length>1?"s":""} ${a.allocations.map(x=>x.table).join(" & ")} — ${a.size} guests`,text,html:`<div style="background:#faf6ef;color:#24150f;padding:28px;font:17px Georgia,serif"><h1 style="color:#8a691b">Your Yoruba Day seating</h1><div style="white-space:pre-line">${escape(text)}</div></div>`};
}
