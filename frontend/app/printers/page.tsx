import PageContainer from "@/components/layout/PageContainer";
import SectionCard from "@/components/common/SectionCard";

const printers = [
  {
    name: "Staples – Midtown Manhattan",
    address: "205 W 42nd St, New York, NY 10036",
    distance: "0.3 mi",
    hours: "Mon–Fri 8am–9pm · Sat 9am–6pm · Sun 10am–5pm",
    open: true,
    price: "$0.09/page B&W · $0.49/page Color",
    notes: "Self-service kiosks available. Bring your USB or email your file.",
    tags: ["Self-Service", "Walk-In"],
    emoji: "🖨️",
  },
  {
    name: "The UPS Store – Brooklyn Heights",
    address: "135 Montague St, Brooklyn, NY 11201",
    distance: "1.1 mi",
    hours: "Mon–Fri 8:30am–6:30pm · Sat 10am–4pm · Closed Sun",
    open: true,
    price: "$0.12/page B&W · $0.65/page Color",
    notes: "Can print from email or Google Drive. Ask for volunteer discount.",
    tags: ["Full-Service", "Discount Available"],
    emoji: "📦",
  },
  {
    name: "FedEx Office – Lower East Side",
    address: "27 Orchard St, New York, NY 10002",
    distance: "1.8 mi",
    hours: "Open 24/7",
    open: true,
    price: "$0.10/page B&W · $0.55/page Color",
    notes: "24/7 access with self-service. Best for large batches overnight.",
    tags: ["24/7", "Large Volume"],
    emoji: "📮",
  },
  {
    name: "Brooklyn Public Library – Central",
    address: "10 Grand Army Plaza, Brooklyn, NY 11238",
    distance: "2.4 mi",
    hours: "Mon–Thu 9am–8pm · Fri–Sat 10am–6pm · Sun 1pm–5pm",
    open: false,
    price: "$0.15/page B&W only",
    notes: "Library card required. Affordable option for community members.",
    tags: ["Library", "Low-Cost"],
    emoji: "📚",
  },
  {
    name: "Office Depot – East Harlem",
    address: "1720 Lexington Ave, New York, NY 10029",
    distance: "3.2 mi",
    hours: "Mon–Sat 8am–8pm · Sun 10am–6pm",
    open: true,
    price: "$0.09/page B&W · $0.45/page Color",
    notes: "Wide-format printing available. Good for posters.",
    tags: ["Wide Format", "Walk-In"],
    emoji: "🗂️",
  },
];

export default function PrintersPage() {
  return (
    <PageContainer>

      {/* Search bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flex: 1,
          padding: "10px 16px", borderRadius: 12,
          background: "#ffffff", border: "1px solid rgba(190,155,70,0.22)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9a8a60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span style={{ fontSize: 13, color: "#b0a070" }}>Search printers near you…</span>
        </div>
        <button style={{ padding: "10px 18px", borderRadius: 12, background: "#f5c842", color: "#1a1000", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(245,200,66,0.3)", whiteSpace: "nowrap" }}>
          📍 Use My Location
        </button>
        <select style={{ padding: "10px 14px", borderRadius: 12, background: "#ffffff", border: "1px solid rgba(190,155,70,0.22)", color: "#5a4a20", fontSize: 13, cursor: "pointer", outline: "none" }}>
          <option>Sort by Distance</option>
          <option>Sort by Price</option>
          <option>Open Now</option>
        </select>
      </div>

      {/* Printer list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {printers.map((p, i) => (
          <div
            key={i}
            className={`anim-fade-up d${Math.min(i + 1, 7)}`}
            style={{
              display: "flex", gap: 18, padding: "20px 22px",
              background: "#ffffff",
              border: "1px solid rgba(190,155,70,0.18)",
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {/* Icon */}
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(245,200,66,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {p.emoji}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15.5, fontWeight: 700, color: "#1a1600", letterSpacing: "-0.3px" }}>
                    {p.name}
                  </h3>
                  <p style={{ fontSize: 12, color: "#9a8a60", marginTop: 3 }}>📍 {p.address}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                    background: p.open ? "#dcfce7" : "#f3f0ea",
                    color: p.open ? "#15803d" : "#6b7280",
                  }}>
                    {p.open ? "● Open Now" : "● Closed"}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: "3px 12px", borderRadius: 10, background: "rgba(245,200,66,0.15)", color: "#92400e" }}>
                    {p.distance}
                  </span>
                </div>
              </div>

              {/* Hours + price */}
              <div style={{ display: "flex", gap: 32, marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#b0a070", marginBottom: 3 }}>Hours</p>
                  <p style={{ fontSize: 12, color: "#5a4a20" }}>{p.hours}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#b0a070", marginBottom: 3 }}>Pricing</p>
                  <p style={{ fontSize: 12, color: "#5a4a20" }}>{p.price}</p>
                </div>
              </div>

              {/* Notes */}
              <p style={{ fontSize: 12, color: "#9a8a60", marginBottom: 12 }}>💡 {p.notes}</p>

              {/* Tags + button */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {p.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 8, background: "#fdf8ec", border: "1px solid rgba(190,155,70,0.22)", color: "#7a6a40" }}>
                    {tag}
                  </span>
                ))}
                <div style={{ flex: 1 }} />
                <button style={{ fontSize: 12.5, fontWeight: 600, padding: "7px 16px", borderRadius: 10, background: "#f5c842", color: "#1a1000", border: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(245,200,66,0.3)" }}>
                  Get Directions →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </PageContainer>
  );
}