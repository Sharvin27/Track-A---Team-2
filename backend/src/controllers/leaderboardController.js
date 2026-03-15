const { pool } = require("../db");

async function getLeaderboard(req, res) {
  try {
    const result = await pool.query(`
      WITH user_totals AS (
        SELECT
          users.id,
          users.username,
          users.email,
          users.created_at,
          users.agreed_to_terms,
          profile_photos.image_url AS profile_photo_url,
          COALESCE(COUNT(route_sessions.id), 0) AS session_count,
          COALESCE(SUM(route_sessions.duration_seconds), 0) AS total_duration_seconds,
          COALESCE(SUM(route_sessions.distance_meters), 0) AS total_distance_meters,
          COALESCE(SUM(jsonb_array_length(route_sessions.stops_json)), 0) AS total_stops
        FROM users
        LEFT JOIN profile_photos ON profile_photos.user_id = users.id
        LEFT JOIN route_sessions ON route_sessions.user_id = users.id
        GROUP BY users.id, profile_photos.image_url
      )
      SELECT
        id,
        username,
        email,
        created_at,
        agreed_to_terms,
        profile_photo_url,
        session_count,
        total_duration_seconds,
        total_distance_meters,
        total_stops,
        DENSE_RANK() OVER (
          ORDER BY total_duration_seconds DESC, total_distance_meters DESC, total_stops DESC, username ASC
        ) AS rank
      FROM user_totals
      ORDER BY rank ASC, username ASC
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load leaderboard.",
    });
  }
}

module.exports = { getLeaderboard };
