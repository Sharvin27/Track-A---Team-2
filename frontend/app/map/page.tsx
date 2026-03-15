import PageContainer from "@/components/layout/PageContainer";
import SectionCard from "@/components/common/SectionCard";

const zones = [
  { name: "South Bronx Zone A",   type: "Flyering",         resources: 4, status: "Active",           volunteers: 3, emoji: "📍" },
  { name: "East Harlem Hub",       type: "Food Pantry",      resources: 7, status: "Active",           volunteers: 5, emoji: "🥫" },
  { name: "Bushwick Distribution", type: "Flyering",         resources: 2, status: "Needs Volunteers", volunteers: 1, emoji: "📄" },
  { name: "Crown Heights Center",  type: "Community Fridge", resources: 3, status: "Active",           volunteers: 4, emoji: "🧊" },
  { name: "Jackson Heights Point", type: "Flyering",         resources: 5, status: "Active",           volunteers: 2, emoji: "📍" },
];

const pins = [
  { top: "28%", left: "38%", color: "#f5c842", label: "South Bronx" },
  { top: "22%", left: "58%", color: "#f97316", label: "East Harlem" },
  { top: "55%", left: "52%", color: "#f5c842", label: "Bushwick" },
  { top: "62%", left: "35%", color: "#10b981", label: "Crown Heights" },
  { top: "35%", left: "72%", color: "#f5c842", label: "Jackson Heights" },
];

const legend = [
  { color: "#f5c842", label: "Flyering Zone" },
  { color: "#f97316", label: "Food Pantry" },
  { color: "#10b981", label: "Community Fridge" },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  "Active":           { bg: "#dcfce7", color: "#15803d" },
  "Needs Volunteers": { bg: "#fef3c7", color: "#92400e" },
};

export default function MapPage() {
  return (
    <PageContainer>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>

        {/* Map area */}
        <SectionCard
          title="Flyering Zones & Food Resources"
          subtitle="Interactive map coming soon — plug in Leaflet or Google Maps here"
        >
          {/* Map placeholder */}
          <div style={{
            position: "relative",
            height: 420,
            borderRadius: 12,
            overflow: "hidden",
            background: "linear-gradient(145deg, #dff0ea 0%, #c8dfd8 50%, #b8d0c8 100%)",
            border: "2px dashed rgba(100,160,140,0.35)",
          }}>
            {/* Grid lines */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }}>
              {[...Array(11)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="#3a7a6a" strokeWidth="1" />
              ))}
              {[...Array(11)].map((_, i) => (
                <line key={`v${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="#3a7a6a" strokeWidth="1" />
              ))}
            </svg>

            {/* Road-like shapes */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }}>
              <line x1="0" y1="45%" x2="100%" y2="45%" stroke="#2a5a4a" strokeWidth="6" />
              <line x1="0" y1="70%" x2="100%" y2="68%" stroke="#2a5a4a" strokeWidth="4" />
              <line x1="30%" y1="0" x2="32%" y2="100%" stroke="#2a5a4a" strokeWidth="5" />
              <line x1="65%" y1="0" x2="63%" y2="100%" stroke="#2a5a4a" strokeWidth="4" />
            </svg>

            {/* Map pins */}
            {pins.map((pin, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: pin.top,
                  left: pin.left,
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: pin.color,
                  border: "2.5px solid white",
                  boxShadow: `0 2px 8px ${pin.color}88`,
                }} />
                <span style={{ fontSize: 9, fontWeight: 600, color: "#2a4a3a", background: "rgba(255,255,255,0.85)", padding: "1px 4px", borderRadius: 4, whiteSpace: "nowrap" }}>
                  {pin.label}
                </span>
              </div>
            ))}

            {/* Center label */}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 42, marginBottom: 8, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}>🗺️</div>
              <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2d5a4a" }}>
                Map Integration Coming Soon
              </p>
              <p style={{ fontSize: 12, color: "#5a8a7a", marginTop: 4 }}>
                Leaflet or Google Maps will load here
              </p>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 14 }}>
            {legend.map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#7a6a40" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Zone list */}
        <SectionCard title="Active Zones" subtitle={`${zones.length} locations`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {zones.map((zone, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#fdf8ec",
                  border: "1px solid rgba(190,155,70,0.18)",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{zone.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1600", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {zone.name}
                    </p>
                    <p style={{ fontSize: 11.5, color: "#9a8a60", marginBottom: 7 }}>
                      {zone.type} · {zone.resources} resources
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                        background: statusStyle[zone.status]?.bg ?? "#f3f4f6",
                        color: statusStyle[zone.status]?.color ?? "#374151",
                      }}>
                        {zone.status}
                      </span>
                      <span style={{ fontSize: 11, color: "#9a8a60" }}>👥 {zone.volunteers}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </PageContainer>
  );
}
