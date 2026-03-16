const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001";

export type LeaderboardEntry = {
  id: number;
  username: string;
  email: string;
  created_at: string;
  agreed_to_terms: boolean;
  profile_photo_url?: string | null;
  session_count: number;
  total_duration_seconds: number;
  total_distance_meters: number;
  total_stops: number;
  flyers: number;
  hours: number;
  rank: number;
  hours_rank?: number;
};

export type LeaderboardResponse = {
  success: boolean;
  count: number;
  data: LeaderboardEntry[];
  podium: LeaderboardEntry[];
  totalVolunteers?: number;
  totalScans?: number;
  totalHours?: number;
};

export async function getLeaderboard(period: "all" | "month" | "week" = "all"): Promise<LeaderboardResponse> {
  const response = await fetch(`${API_BASE}/api/leaderboard?period=${period}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || payload.error || "Failed to load leaderboard");
  }
  return payload;
}
