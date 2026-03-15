import PageContainer from "@/components/layout/PageContainer";
import SectionCard from "@/components/common/SectionCard";
import PodiumCanvas from "@/components/leaderboard/PodiumCanvas";

const TOP = [
  { rank: 1, name: "Priya Kapoor", flyers: 820, zones: 14, hours: 68, badge: "🥇", avatar: "PK", color: "#f5c842",  isYou: false },
  { rank: 2, name: "Marcus Webb",  flyers: 710, zones: 11, hours: 52, badge: "🥈", avatar: "MW", color: "#c0c0c0",  isYou: false },
  { rank: 3, name: "Sofia Reyes",  flyers: 640, zones: 10, hours: 47, badge: "🥉", avatar: "SR", color: "#cd7f32",  isYou: false },
  { rank: 4, name: "Jamie Diaz",   flyers: 340, zones: 8,  hours: 24, badge: null,  avatar: "JD", color: "#f5c842",  isYou: true  },
  { rank: 5, name: "Leo Tran",     flyers: 310, zones: 7,  hours: 22, badge: null,  avatar: "LT", color: "#6b7280",  isYou: false },
  { rank: 6, name: "Amara Osei",   flyers: 280, zones: 6,  hours: 19, badge: null,  avatar: "AO", color: "#6b7280",  isYou: false },
  { rank: 7, name: "Ben Zhao",     flyers: 250, zones: 5,  hours: 17, badge: null,  avatar: "BZ", color: "#6b7280",  isYou: false },
  { rank: 8, name: "Nadia Frost",  flyers: 200, zones: 4,  hours: 14, badge: null,  avatar: "NF", color: "#6b7280",  isYou: false },
];

const MAX_FLYERS = 820;
const rankColors: Record<number, string> = { 1: "#f5c842", 2: "#9ca3af", 3: "#b45309" };

const monthlyStats = [
  { label: "Total Flyers",      value: "4,554", icon: "📄" },
  { label: "Active Volunteers", value: "37",    icon: "🙌" },
  { label: "Zones Covered",     value: "12",    icon: "📍" },
  { label: "Avg Flyers / Vol.", value: "123",   icon: "📊" },
];

export default function LeaderboardPage() {
  return (
    <PageContainer>

        {/* ── Row 1: 3D Podium + Sidebar ───────────────────────────── */}
        <div
          className="anim-fade-up d1"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 20 }}
        >
          {/* 3D Podium — dark SectionCard with noPadding so canvas bleeds to edges */}
          <SectionCard
            dark
            noPadding
            style={{ position: "relative", minHeight: 360, overflow: "hidden" }}
          >
            {/* Gradient header overlay */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
              padding: "20px 24px",
              background: "linear-gradient(to bottom, rgba(26,18,0,0.92) 0%, transparent 100%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#f5c842", letterSpacing: "-0.4px" }}>
                    🏆 Champions Podium
                  </h3>
                  <p style={{ fontSize: 12, color: "rgba(245,200,66,0.45)", marginTop: 2 }}>March 2025 · Live 3D</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["🥇 PK", "🥈 MW", "🥉 SR"].map((t) => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "rgba(245,200,66,0.12)", color: "rgba(245,200,66,0.8)", border: "1px solid rgba(245,200,66,0.2)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Three.js canvas */}
            <PodiumCanvas />

            {/* Bottom legend overlay */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
              padding: "16px 24px",
              background: "linear-gradient(to top, rgba(26,18,0,0.95) 0%, transparent 100%)",
              display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap",
            }}>
              {[
                { name: "Priya K.",  flyers: 820, color: "#f5c842", rank: "1st" },
                { name: "Marcus W.", flyers: 710, color: "#c0c0c0", rank: "2nd" },
                { name: "Sofia R.",  flyers: 640, color: "#cd7f32", rank: "3rd" },
              ].map((p) => (
                <div key={p.name} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 1 }}>{p.rank} · {p.name}</p>
                  <p style={{ fontSize: 10.5, color: "rgba(245,200,66,0.4)" }}>{p.flyers} flyers</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Your Standing */}
            <SectionCard dark title="Your Standing" subtitle="March 2025">
              <div style={{ textAlign: "center", padding: "8px 0 12px" }}>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 56, fontWeight: 700, color: "#f5c842", lineHeight: 1, letterSpacing: "-2px" }}>
                  #4
                </div>
                <p style={{ fontSize: 12, color: "rgba(245,200,66,0.45)", marginTop: 4 }}>out of 37 volunteers</p>
              </div>
              {/* Progress bar toward #3 */}
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(245,200,66,0.5)" }}>You · 340</span>
                  <span style={{ fontSize: 11, color: "rgba(245,200,66,0.5)" }}>Sofia #3 · 640</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(340 / 640) * 100}%`, borderRadius: 99, background: "linear-gradient(90deg, #f5c842, #fbbf24)", boxShadow: "0 0 8px rgba(245,200,66,0.6)" }} />
                </div>
                <p style={{ fontSize: 11.5, color: "rgba(245,200,66,0.65)", marginTop: 10, textAlign: "center" }}>
                  🔥 <strong style={{ color: "#f5c842" }}>300 more flyers</strong> to reach #3!
                </p>
              </div>
            </SectionCard>

            {/* Monthly Stats */}
            <SectionCard title="Monthly Stats" style={{ flex: 1 }}>
              {monthlyStats.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 0",
                    borderBottom: i < monthlyStats.length - 1 ? "1px solid rgba(190,155,70,0.12)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <span style={{ fontSize: 12.5, color: "#7a6a40" }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1600", fontFamily: "'Fraunces', Georgia, serif" }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </SectionCard>

          </div>
        </div>

        {/* ── Row 2: Full Rankings ──────────────────────────────────── */}
        <SectionCard
          title="Full Rankings"
          subtitle="All 37 volunteers · Updated live"
          action={
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All Time", "This Month", "This Week"].map((t, i) => (
                <button
                  key={t}
                  style={{
                    fontSize: 11.5, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                    border: `1px solid ${i === 1 ? "#f5c842" : "rgba(190,155,70,0.2)"}`,
                    background: i === 1 ? "#fef9c3" : "transparent",
                    color: i === 1 ? "#92400e" : "#9a8a60",
                    fontWeight: i === 1 ? 600 : 400,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        >
          {/* Column headers */}
          <div style={{ marginTop: 6, overflowX: "auto" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "44px minmax(180px, 1fr) 200px 90px 70px 70px",
              gap: 12, padding: "0 10px 10px",
              borderBottom: "1px solid rgba(190,155,70,0.15)",
              minWidth: 640,
            }}>
              {["#", "Volunteer", "Progress", "Flyers", "Zones", "Hours"].map((h) => (
                <span key={h} style={{ fontSize: 10.5, fontWeight: 600, color: "#9a8a60", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {h}
                </span>
              ))}
            </div>
            {TOP.map((v, i) => {
              const pct = Math.round((v.flyers / MAX_FLYERS) * 100);
              return (
                <div
                  key={v.rank}
                  className="anim-fade-up"
                  style={{
                    animationDelay: `${0.3 + i * 0.06}s`,
                    display: "grid",
                    gridTemplateColumns: "44px minmax(180px, 1fr) 200px 90px 70px 70px",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 10px",
                    borderRadius: 10,
                    background: v.isYou ? "rgba(245,200,66,0.07)" : i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)",
                    border: v.isYou ? "1.5px solid rgba(245,200,66,0.30)" : "1.5px solid transparent",
                    marginBottom: 3,
                    minWidth: 640,
                  }}
                >
                  {/* Rank */}
                  <div style={{ textAlign: "center" }}>
                    {v.badge
                      ? <span style={{ fontSize: 18 }}>{v.badge}</span>
                      : <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, fontWeight: 700, color: rankColors[v.rank] ?? "#9a8a60" }}>{v.rank}</span>
                    }
                  </div>

                  {/* Avatar + Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: v.isYou ? "#f5c842" : v.rank <= 3 ? (rankColors[v.rank] + "33") : "#f3f0e8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      color: v.isYou ? "#1a1000" : v.rank <= 3 ? rankColors[v.rank] : "#5a4a20",
                    }}>
                      {v.avatar}
                    </div>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1a1600" }}>
                        {v.name}
                        {v.isYou && <span style={{ fontSize: 10.5, fontWeight: 400, color: "#9a8a60", marginLeft: 6 }}>(You)</span>}
                      </p>
                      <p style={{ fontSize: 11, color: "#9a8a60", marginTop: 1 }}>{v.zones} zones · {v.hours}h</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div style={{ height: 5, borderRadius: 99, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`, borderRadius: 99,
                        background: v.rank === 1 ? "linear-gradient(90deg,#f5c842,#fbbf24)"
                          : v.rank === 2 ? "linear-gradient(90deg,#9ca3af,#d1d5db)"
                          : v.rank === 3 ? "linear-gradient(90deg,#b45309,#d97706)"
                          : v.isYou     ? "linear-gradient(90deg,#f5c842,#fde68a)"
                          : "linear-gradient(90deg,#c4b89a,#d4c8aa)",
                      }} />
                    </div>
                    <p style={{ fontSize: 10, color: "#b0a070", marginTop: 3 }}>{pct}% of top</p>
                  </div>

                  {/* Flyers */}
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1600", fontFamily: "'Fraunces', Georgia, serif" }}>
                    {v.flyers.toLocaleString()}
                  </span>

                  {/* Zones */}
                  <span style={{ fontSize: 13, color: "#5a4a20" }}>{v.zones}</span>

                  {/* Hours */}
                  <span style={{ fontSize: 13, color: "#5a4a20" }}>{v.hours}h</span>
                </div>
              );
            })}
          </div>
        </SectionCard>

    </PageContainer>
  );
}
