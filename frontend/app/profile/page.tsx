import PageContainer from "@/components/layout/PageContainer";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";

const stats = [
  { label: "Flyers Handed Out",  value: "340", icon: "📄", iconBg: "#fef3c7" },
  { label: "Zones Visited",      value: "8",   icon: "📍", iconBg: "#ede9fe" },
  { label: "Hours Volunteered",  value: "24",  icon: "⏱️", iconBg: "#dcfce7" },
  { label: "Current Rank",       value: "#4",  icon: "🏆", iconBg: "#fee2e2" },
];

const activity = [
  { date: "Mar 10", zone: "South Bronx Zone A",    flyers: 60  },
  { date: "Mar 7",  zone: "East Harlem Hub",        flyers: 45  },
  { date: "Mar 3",  zone: "Bushwick Distribution",  flyers: 80  },
  { date: "Feb 28", zone: "Crown Heights Center",   flyers: 55  },
  { date: "Feb 21", zone: "Jackson Heights Point",  flyers: 100 },
];

const badges = [
  { emoji: "🌱", label: "First Flyer",    earned: true  },
  { emoji: "🔥", label: "On a Streak",   earned: true  },
  { emoji: "🗺️", label: "Zone Explorer", earned: true  },
  { emoji: "💯", label: "100 Flyers",    earned: true  },
  { emoji: "🏆", label: "Top 5",         earned: false },
  { emoji: "🌟", label: "Community Star",earned: false },
];

const profileMeta = [
  { icon: "📍", label: "Brooklyn, NY" },
  { icon: "📅", label: "Joined January 2025" },
  { icon: "🌐", label: "English, Spanish" },
];

export default function ProfilePage() {
  return (
    <PageContainer>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>

        {/* ── Left column ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Profile card */}
          <SectionCard>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 8, paddingBottom: 8 }}>
              {/* Avatar */}
              <div style={{
                width: 76, height: 76, borderRadius: 20, marginBottom: 14,
                background: "linear-gradient(135deg, #f5c842, #e8a200)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 700, color: "#1a1000",
                boxShadow: "0 4px 16px rgba(245,200,66,0.35)",
              }}>
                SG
              </div>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#1a1600", letterSpacing: "-0.4px" }}>
                Sharvin Gavad
              </h2>
              <p style={{ fontSize: 13, color: "#9a8a60", marginTop: 3 }}>Community Volunteer</p>
              <div style={{ marginTop: 10, padding: "4px 12px", borderRadius: 99, background: "#dcfce7", fontSize: 11.5, fontWeight: 600, color: "#15803d" }}>
                ✅ Verified Volunteer
              </div>

              {/* Meta info */}
              <div style={{ width: "100%", marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(190,155,70,0.18)", textAlign: "left" }}>
                {profileMeta.map((m) => (
                  <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    <span style={{ fontSize: 13, color: "#5a4a20" }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Badges */}
          <SectionCard title="Badges">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 8 }}>
              {badges.map((b) => (
                <div
                  key={b.label}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    padding: "10px 6px", borderRadius: 12, textAlign: "center",
                    background: b.earned ? "rgba(245,200,66,0.12)" : "#f5f3ee",
                    border: `1px solid ${b.earned ? "rgba(245,200,66,0.3)" : "rgba(0,0,0,0.05)"}`,
                    opacity: b.earned ? 1 : 0.55,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{b.emoji}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: "#1a1600", lineHeight: 1.2 }}>{b.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── Right column ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            {stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} iconBg={s.iconBg} />
            ))}
          </div>

          {/* Activity */}
          <SectionCard title="Recent Activity" subtitle="Your last 5 volunteering sessions">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activity.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 14px", borderRadius: 12,
                    background: "#fdf8ec",
                    border: "1px solid rgba(190,155,70,0.18)",
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(245,200,66,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                    📄
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1a1600" }}>{a.zone}</p>
                    <p style={{ fontSize: 12, color: "#9a8a60", marginTop: 2 }}>{a.flyers} flyers distributed</p>
                  </div>
                  <span style={{ fontSize: 12, color: "#b0a070", flexShrink: 0 }}>{a.date}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Progress to next rank */}
          <SectionCard title="Progress to #3" subtitle="Keep going — you're almost there!">
            <div style={{ padding: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#7a6a40" }}>You · 340 flyers</span>
                <span style={{ fontSize: 12, color: "#7a6a40" }}>Sofia #3 · 640 flyers</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(340/640)*100}%`, borderRadius: 99, background: "linear-gradient(90deg,#f5c842,#fbbf24)", boxShadow: "0 0 8px rgba(245,200,66,0.5)" }} />
              </div>
              <p style={{ fontSize: 12, color: "#9a8a60", marginTop: 8 }}>
                🔥 <strong style={{ color: "#1a1600" }}>300 more flyers</strong> to reach rank #3
              </p>
            </div>
          </SectionCard>

        </div>
      </div>
    </PageContainer>
  );
}
