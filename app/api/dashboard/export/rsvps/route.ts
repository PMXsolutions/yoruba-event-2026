import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/rbac";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requireAuth("rsvp.export");
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "csv";

    const supabase = createServiceRoleClient();
    const { data } = await supabase.from("rsvps").select("*").order("created_at", { ascending: false });

    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(data ?? []);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="rsvps.xlsx"',
        },
      });
    }

    const rows = data ?? [];
    const header = ["registration_reference", "full_name", "email", "phone", "number_of_attendees", "ticket_type", "created_at"];
    const csv = [
      header.join(","),
      ...rows.map((r) => header.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="rsvps.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
