"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import { useAuth } from "@/context/AuthContext";

/** Scalable volunteer steps: add more entries here as needed. */
const VOLUNTEER_STEPS: {
  title: string;
  action: "external" | "internal";
  url?: string;
  href?: string;
}[] = [
  {
    title: "Create and Download static flyers",
    action: "external",
    url: "https://www.foodhelpline.org/share",
  },
  {
    title: "Locate Nearby printers",
    action: "internal",
    href: "/printers",
  },
];

const MISSION =
  "Our mission is to connect neighbors with free food resources in their community. By distributing flyers and sharing information about pantries, community fridges, and food programs, we help reduce food insecurity one door at a time. We believe everyone deserves access to nutritious food and that volunteers like you are essential to making that happen.";

type Step = "choice" | "login" | "signup" | "mission";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, login, signup, signInAsGuest, agreeToTerms } = useAuth();
  const [step, setStep] = useState<Step>("choice");
  const [error, setError] = useState("");
  const [agree, setAgree] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signUsername, setSignUsername] = useState("");
  const [signEmail, setSignEmail] = useState("");
  const [signPassword, setSignPassword] = useState("");
  const [signConfirm, setSignConfirm] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (signPassword !== signConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (signPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      await signup(signUsername, signEmail, signPassword);
      setStep("mission");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  const handleContinue = async () => {
    if (!agree) {
      setError("Please agree to the terms to continue.");
      return;
    }
    setError("");
    try {
      await agreeToTerms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid rgba(190,155,70,0.18)",
    borderRadius: 18,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    padding: "32px 40px",
    maxWidth: 440,
    margin: "0 auto 24px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(190,155,70,0.25)",
    fontSize: 14,
    color: "#1a1600",
    marginBottom: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#5a4a20",
    marginBottom: 6,
  };

  const buttonPrimary: React.CSSProperties = {
    width: "100%",
    padding: "12px 20px",
    borderRadius: 11,
    border: "none",
    background: "linear-gradient(135deg, #f5c842 0%, #e8a200 100%)",
    color: "#1a1000",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 3px 12px rgba(245,200,66,0.35)",
  };

  const buttonSecondary: React.CSSProperties = {
    width: "100%",
    padding: "12px 20px",
    borderRadius: 11,
    border: "1.5px solid rgba(190,155,70,0.35)",
    background: "transparent",
    color: "#5a4a20",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  };

  if (user && (user.agreed_to_terms || user.isGuest)) {
    return (
      <PageContainer>
        <div className="anim-fade-up d1" style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#1a1000",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Get started volunteering now
          </h1>
          <p style={{ fontSize: 15, color: "#5a4a20", textAlign: "center", marginBottom: 32 }}>
            Follow these steps to make an impact in your community.
          </p>
        </div>
        <div className="anim-fade-up d2" style={{ maxWidth: 520, margin: "0 auto" }}>
          {VOLUNTEER_STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(190,155,70,0.18)",
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                padding: "20px 24px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1600" }}>
                <span style={{ color: "#f5c842", marginRight: 8 }}>Step {i + 1}.</span>
                {s.title}
              </span>
              {s.action === "external" && s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #f5c842 0%, #e8a200 100%)",
                    color: "#1a1000",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(245,200,66,0.35)",
                  }}
                >
                  Open link
                </a>
              )}
              {s.action === "internal" && s.href && (
                <button
                  type="button"
                  onClick={() => router.push(s.href!)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #f5c842 0%, #e8a200 100%)",
                    color: "#1a1000",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(245,200,66,0.35)",
                  }}
                >
                  Go to page
                </button>
              )}
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (user && step === "mission") {
    return (
      <PageContainer>
        <div
          className="anim-fade-up d1"
          style={{
            position: "relative",
            borderRadius: 20,
            overflow: "hidden",
            background: "linear-gradient(130deg, #f5c842 0%, #fbbf24 60%, #f59e0b 100%)",
            boxShadow: "0 8px 32px rgba(245,200,66,0.35)",
            padding: "40px 48px",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍋</div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 700, color: "#1a1000", marginBottom: 8 }}>
            One more step
          </h2>
          <p style={{ fontSize: 14, color: "rgba(60,40,0,0.7)", maxWidth: 420, margin: "0 auto" }}>
            Please read our mission and agree to the terms to start volunteering.
          </p>
        </div>

        <div className="anim-fade-up d2" style={cardStyle}>
          <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 700, color: "#1a1600", marginBottom: 16 }}>
            Our mission
          </h3>
          <p style={{ fontSize: 14, color: "#5a4a20", lineHeight: 1.7, marginBottom: 24 }}>
            {MISSION}
          </p>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: "#f5c842" }}
            />
            <span style={{ fontSize: 13, color: "#5a4a20" }}>
              I agree to the terms of service and community guidelines.
            </span>
          </label>
          {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{error}</p>}
          <button type="button" style={buttonPrimary} onClick={handleContinue}>
            Continue to dashboard
          </button>
        </div>
      </PageContainer>
    );
  }

  if (step === "login") {
    return (
      <PageContainer>
        <div className="anim-fade-up d1" style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#1a1000" }}>
            Log in
          </h2>
          <p style={{ fontSize: 14, color: "#9a8a60", marginTop: 6 }}>Welcome back to Lemontree.</p>
        </div>
        <div className="anim-fade-up d2" style={cardStyle}>
          <form onSubmit={handleLogin}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{error}</p>}
            <button type="submit" style={buttonPrimary}>
              Log in
            </button>
            <button type="button" style={buttonSecondary} onClick={() => { setStep("choice"); setError(""); }}>
              Back
            </button>
          </form>
        </div>
      </PageContainer>
    );
  }

  if (step === "signup") {
    return (
      <PageContainer>
        <div className="anim-fade-up d1" style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#1a1000" }}>
            Create an account
          </h2>
          <p style={{ fontSize: 14, color: "#9a8a60", marginTop: 6 }}>Join the Lemontree volunteer community.</p>
        </div>
        <div className="anim-fade-up d2" style={cardStyle}>
          <form onSubmit={handleSignup}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={signUsername}
              onChange={(e) => setSignUsername(e.target.value)}
              style={inputStyle}
              placeholder="johndoe"
              required
              autoComplete="username"
            />
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={signEmail}
              onChange={(e) => setSignEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={signPassword}
              onChange={(e) => setSignPassword(e.target.value)}
              style={inputStyle}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <label style={labelStyle}>Confirm password</label>
            <input
              type="password"
              value={signConfirm}
              onChange={(e) => setSignConfirm(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{error}</p>}
            <button type="submit" style={buttonPrimary}>
              Sign up
            </button>
            <button type="button" style={buttonSecondary} onClick={() => { setStep("choice"); setError(""); }}>
              Back
            </button>
          </form>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div
        className="anim-fade-up d1"
        style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          background: "linear-gradient(130deg, #f5c842 0%, #fbbf24 60%, #f59e0b 100%)",
          boxShadow: "0 8px 32px rgba(245,200,66,0.35)",
          padding: "48px 56px",
          textAlign: "center",
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 14 }}>🍋</div>
        <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 34, fontWeight: 700, color: "#1a1000", letterSpacing: "-0.8px", marginBottom: 10 }}>
          Welcome to the Hub
        </h2>
        <p style={{ fontSize: 14.5, color: "rgba(60,40,0,0.65)", maxWidth: 480, margin: "0 auto 28px" }}>
          Get started by logging in or creating an account.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setStep("login")}
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              border: "none",
              background: "rgba(18,12,0,0.84)",
              color: "#f5c842",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 3px 12px rgba(0,0,0,0.22)",
            }}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setStep("signup")}
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              border: "2px solid rgba(18,12,0,0.5)",
              background: "rgba(255,255,255,0.9)",
              color: "#1a1000",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={signInAsGuest}
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              border: "1.5px solid rgba(190,155,70,0.4)",
              background: "transparent",
              color: "#5a4a20",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue as guest
          </button>
        </div>
      </div>

      <div className="anim-fade-up d2" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9a8a60" }}>
          New here? <Link href="/onboarding" style={{ color: "#d97706", fontWeight: 600 }} onClick={(e) => { e.preventDefault(); setStep("signup"); }}>Sign up</Link> to volunteer and track your impact.
        </p>
      </div>
    </PageContainer>
  );
}
