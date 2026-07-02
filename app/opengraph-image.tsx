import { ImageResponse } from "next/og";
import { ACTIVE_EVENT } from "@/lib/site";

export const runtime = "edge";
export const alt = ACTIVE_EVENT.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0f0806 0%, #24150f 50%, #3a2419 100%)",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#e4c76a",
            marginBottom: 24,
          }}
        >
          {ACTIVE_EVENT.organisation}
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 600,
            color: "#faf6ef",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 32,
          }}
        >
          {ACTIVE_EVENT.name}
        </div>
        <div style={{ fontSize: 32, color: "#c9a227", marginBottom: 16 }}>
          {ACTIVE_EVENT.heroDateLine}
        </div>
        <div style={{ fontSize: 24, color: "#faf6ef", opacity: 0.8 }}>
          {ACTIVE_EVENT.venue.name} · Canberra, ACT
        </div>
      </div>
    ),
    { ...size },
  );
}
