const { pool } = require("../db");

const FLYER_WEIGHT = 1.5;

async function getLeaderboard(req, res) {
  try {
    let result;
    try {
      result = await pool.query(
      `
      WITH stats AS (
        SELECT
          users.id,
          users.username,
          users.email,
          users.created_at,
          users.agreed_to_terms,
          profile_photos.image_url AS profile_photo_url,
          COALESCE(user_stats.flyers, 0)::BIGINT AS flyers,
          COALESCE(user_stats.hours, 0)::DOUBLE PRECISION AS hours
        FROM users
        LEFT JOIN profile_photos ON profile_photos.user_id = users.id
        LEFT JOIN user_stats ON user_stats.id = users.id
      ),
      ranked AS (
        SELECT
          id,
          username,
          email,
          created_at,
          agreed_to_terms,
          profile_photo_url,
          flyers,
          hours,
          (flyers * ($1::double precision) + hours) AS weighted_score,
          DENSE_RANK() OVER (
            ORDER BY (flyers * ($1::double precision) + hours) DESC, hours DESC, username ASC
          ) AS rank_position
        FROM stats
      ),
      by_hours AS (
        SELECT
          id,
          username,
          email,
          created_at,
          agreed_to_terms,
          profile_photo_url,
          flyers,
          hours,
          DENSE_RANK() OVER (ORDER BY hours DESC, flyers DESC, username ASC) AS hours_rank
        FROM stats
      )
      SELECT
        r.id,
        r.username,
        r.email,
        r.created_at,
        r.agreed_to_terms,
        r.profile_photo_url,
        r.flyers,
        r.hours,
        r.weighted_score,
        r.rank_position,
        h.hours_rank
      FROM ranked r
      JOIN by_hours h ON h.id = r.id
      ORDER BY r.rank_position ASC, r.username ASC
      `,
      [FLYER_WEIGHT]
      );
    } catch (queryErr) {
      const msg = queryErr.message || "";
      if (msg.includes("user_stats") && (msg.includes("does not exist") || msg.includes("relation"))) {
        result = await pool.query(`
          WITH base AS (
            SELECT
              users.id,
              users.username,
              users.email,
              users.created_at,
              users.agreed_to_terms,
              profile_photos.image_url AS profile_photo_url,
              0::BIGINT AS flyers,
              0::DOUBLE PRECISION AS hours
            FROM users
            LEFT JOIN profile_photos ON profile_photos.user_id = users.id
          ),
          numbered AS (
            SELECT *, ROW_NUMBER() OVER (ORDER BY username ASC)::INTEGER AS rank_position, ROW_NUMBER() OVER (ORDER BY username ASC)::INTEGER AS hours_rank FROM base
          )
          SELECT * FROM numbered ORDER BY rank_position ASC
        `);
      } else {
        throw queryErr;
      }
    }

    const data = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      created_at: row.created_at,
      agreed_to_terms: row.agreed_to_terms,
      profile_photo_url: row.profile_photo_url,
      flyers: Number(row.flyers ?? 0),
      hours: Number(row.hours ?? 0),
      total_duration_seconds: Math.round(Number(row.hours ?? 0) * 3600),
      session_count: 0,
      total_distance_meters: 0,
      total_stops: 0,
      rank: row.rank_position,
      hours_rank: row.hours_rank,
    }));

    const podium = result.rows
      .sort((a, b) => (a.hours_rank ?? 999) - (b.hours_rank ?? 999))
      .slice(0, 3)
      .map((row, index) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        created_at: row.created_at,
        agreed_to_terms: row.agreed_to_terms,
        profile_photo_url: row.profile_photo_url,
        flyers: Number(row.flyers ?? 0),
        hours: Number(row.hours ?? 0),
        total_duration_seconds: Math.round(Number(row.hours ?? 0) * 3600),
        rank: index + 1,
        hours_rank: index + 1,
      }));

    return res.json({
      success: true,
      count: data.length,
      data,
      podium,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    const message = error.message || "Failed to load leaderboard.";
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? message : "Failed to load leaderboard.",
    });
  }
}

module.exports = { getLeaderboard };
