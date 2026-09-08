import { ImageResponse } from "next/og";
import { fileStore } from "@/lib/store/fileStore";
import { computeStats } from "@/lib/stats";
import { COUNTRIES } from "@/lib/countries";

export const runtime = "nodejs";
export const alt = "A See Me Travel globe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The generated share card. This is the reason v2 is on Next.js at all: it is the
 * first thing anyone sees when a globe link is pasted into a messenger, and CRA
 * could not produce it. See DESIGN_PLAN.md section 2.2.
 *
 * Satori (which renders this) supports a flexbox subset only, and throws unless
 * every element with more than one child declares an explicit display. Every div
 * below sets one for that reason.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const globe = await fileStore.get(id);
  const stats = computeStats(globe?.countries ?? []);

  const names = (globe?.countries ?? [])
    .map((cid) => COUNTRIES[cid]?.name)
    .filter(Boolean)
    .sort();

  // Enough names to feel specific, not so many that the card becomes a list.
  const shown = names.slice(0, 12);
  const rest = names.length - shown.length;
  const footer =
    shown.length > 0
      ? `${shown.join(", ")}${rest > 0 ? ` and ${rest} more` : ""}`
      : "An empty globe, waiting for its first trip";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070a12",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#f0a13b",
              marginRight: 14,
            }}
          />
          <div style={{ display: "flex", color: "#93a0b4", fontSize: 24 }}>See Me Travel</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div
              style={{
                display: "flex",
                color: "#f0a13b",
                fontSize: 180,
                lineHeight: 1,
                fontWeight: 700,
                marginRight: 20,
              }}
            >
              {String(stats.countries)}
            </div>
            <div
              style={{
                display: "flex",
                color: "#e7ecf3",
                fontSize: 52,
                paddingBottom: 18,
              }}
            >
              {stats.countries === 1 ? "country" : "countries"}
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 28 }}>
            <div style={{ display: "flex", color: "#e7ecf3", fontSize: 30 }}>
              {`${stats.percentOfWorld}%`}
            </div>
            <div style={{ display: "flex", color: "#93a0b4", fontSize: 30, marginLeft: 10 }}>
              of the world
            </div>
            <div style={{ display: "flex", color: "#e7ecf3", fontSize: 30, marginLeft: 40 }}>
              {`${stats.continents}/${stats.totalContinents}`}
            </div>
            <div style={{ display: "flex", color: "#93a0b4", fontSize: 30, marginLeft: 10 }}>
              continents
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: "1px solid #212c3e",
            paddingTop: 28,
            color: "#93a0b4",
            fontSize: 24,
          }}
        >
          {footer}
        </div>
      </div>
    ),
    size
  );
}
