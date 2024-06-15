import migrations from "node-pg-migrate";
import type { Pool } from "pg";
import pg from "pg";
import {
  Activity,
  ActivityDB,
  ActivityWithData,
  FullActivity,
  PodUser,
  PodUserDB,
  User,
  UserActivitySegmentsDB,
  UserDB,
  UserWithData,
  UserWithScore,
} from "./types";

/*******************************
  Basics
*******************************/

const getPool = (databaseUrl?: string) => {
  if (!databaseUrl) throw new Error(`No database url`);

  const CERT = process.env.CA_CERT_BASE_64
    ? Buffer.from(process.env.CA_CERT_BASE_64, "base64").toString("ascii")
    : "";

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost")
      ? undefined
      : { rejectUnauthorized: true, ca: CERT || process.env.CA_CERT },
  });

  const parsedUrl = new URL(databaseUrl);
  console.log(`[DB] connected to host: ${parsedUrl.host}`);

  return pool;
};

const migrateDb = async (pool: Pool, down = false) => {
  const client = await pool.connect();

  const res = await migrations({
    dbClient: client,
    migrationsTable: "pgmigrations",
    dir: "migrations",
    direction: down ? "down" : "up",
    count: Infinity,
    noLock: true,
  });

  console.log(`[DB] Did ${res.length} ${down ? "down" : "up"} migrations`);

  client.release();
};

export const getDB = async () => {
  const pool = getPool(process.env.DATABASE_URL);

  await migrateDb(pool);

  return pool;
};

/*******************************
  Query the Postgres Database
*******************************/

type QueryArgs = (string | number | boolean | string[] | null)[] | undefined;

export async function sqlQuery(
  pool: Pool,
  query: string,
  args: QueryArgs = undefined
) {
  try {
    const res = await pool.query(query, args);
    return res;
  } catch (e) {
    console.log(`[ERROR] SQL query\n`, `"${query}"\n`, e);
    throw e;
  }
}

/*******************************
  Write
*******************************/

export const insertUser = async (pool: Pool, user: UserWithData) => {
  const res = await sqlQuery(
    pool,
    `
    INSERT INTO users (id, data, created_at, updated_at)
    VALUES ($1, $2, NOW(), NOW())
    RETURNING *;
  `,
    [user.id, JSON.stringify(user.data)]
  );
  return res.rows[0] as UserDB;
};

export const insertPod = async (pool: Pool, user: PodUser) => {
  const res = await sqlQuery(
    pool,
    `
    INSERT INTO pods (semaphore_id, strava_id, proof, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (semaphore_id) DO UPDATE SET
      strava_id = EXCLUDED.strava_id,
      proof = EXCLUDED.proof,
      updated_at = EXCLUDED.updated_at
    RETURNING *;
    `,
    [user.semaphore_id, user.strava_id, user.proof]
  );
  return res.rows[0] as PodUserDB;
};

export const updateUser = async (pool: Pool, user: UserWithData) => {
  const res = await sqlQuery(
    pool,
    `
    UPDATE users
    SET data = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `,
    [user.id, JSON.stringify(user.data)]
  );
  return res.rows[0] as UserDB;
};

export const updateUserScore = async (
  pool: Pool,
  userId: string,
  score: number
) => {
  const res = await sqlQuery(
    pool,
    `
    UPDATE users
    SET score = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `,
    [userId, score || 0]
  );
  return res.rows[0] as UserDB;
};

export const insertActivity = async (
  pool: Pool,
  user_id: string,
  activity: Activity
) => {
  const res = await sqlQuery(
    pool,
    `
    INSERT INTO activities (id, user_id, data, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING *;
  `,
    [activity.id, user_id, JSON.stringify(activity)]
  );
  return res.rows[0] as ActivityDB;
};

export const bulkInsertActivities = async (
  pool: Pool,
  user_id: string,
  activities: Activity[]
) => {
  console.log(`[DB] adding ${activities.length} activities`);
  if (activities.length === 0) return [];
  const values: QueryArgs = [];
  const placeholders = activities
    .map((a, index) => {
      const i = index * 5; // 5 parameters per activity
      values.push(
        a.id,
        user_id,
        JSON.stringify(a),
        new Date().toISOString(),
        new Date().toISOString()
      );
      return `($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5})`;
    })
    .join(", ");

  const res = await sqlQuery(
    pool,
    `
    INSERT INTO activities (id, user_id, data, created_at, updated_at)
    VALUES ${placeholders}
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
    RETURNING *;
  `,
    values
  );
  return res.rows as ActivityDB[];
};

export const insertUserActivitySegments = async (
  pool: Pool,
  user_id: string,
  activity_id: string,
  segments: string[]
) => {
  const res = await sqlQuery(
    pool,
    `
    INSERT INTO user_activity_segments (user_id, activity_id, segments, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (activity_id) DO UPDATE SET
      segments = EXCLUDED.segments,
      updated_at = NOW()
    RETURNING *;
  `,
    [user_id, activity_id, JSON.stringify(segments)]
  );
  return res.rows[0] as UserActivitySegmentsDB;
};

export const markActivityAsDeleted = async (
  pool: Pool,
  activity_id: string
) => {
  const res = await sqlQuery(
    pool,
    `
    UPDATE activities
    SET deleted = true, updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `,
    [activity_id]
  );
  return res.rows[0] as ActivityDB;
};

/*******************************
  Read
*******************************/

export const getUserById = async (pool: Pool, id: string) => {
  const res = await sqlQuery(
    pool,
    `
    SELECT * FROM users WHERE id = $1;
  `,
    [id]
  );
  return res.rows?.[0] as UserDB | undefined;
};

export const getPodBySemaphoreId = async (pool: Pool, id: string) => {
  const res = await sqlQuery(
    pool,
    `
    SELECT * FROM pods WHERE semaphore_id = $1;
  `,
    [id]
  );
  return res.rows?.[0] as PodUserDB | undefined;
};

export const getActivitiesByUserId = async (pool: Pool, userId: string) => {
  const res = await sqlQuery(
    pool,
    `
    SELECT * FROM activities WHERE user_id = $1 AND deleted = false;
  `,
    [userId]
  );
  return res.rows as ActivityDB[];
};

export const getActivityById = async (pool: Pool, id: string) => {
  const res = await sqlQuery(
    pool,
    `
    SELECT * FROM activities WHERE id = $1;
  `,
    [id]
  );
  return res.rows?.[0] as ActivityDB | undefined;
};

export const getActivitySegmentsByUserId = async (
  pool: Pool,
  userId: string
) => {
  const res = await sqlQuery(
    pool,
    `
    SELECT s.*, a.*
    FROM user_activity_segments s
    JOIN activities a ON s.activity_id = a.id
    WHERE s.user_id = $1 AND a.deleted = false AND a.data->>'flagged' = 'false';
  `,
    [userId]
  );
  return res.rows as Array<UserActivitySegmentsDB & ActivityWithData>;
};

export const getAllActivitySegments = async (pool: Pool) => {
  const res = await sqlQuery(pool, `SELECT * FROM user_activity_segments;`);
  return res.rows as UserActivitySegmentsDB[];
};

export const getActivitySegmentByActivityId = async (
  pool: Pool,
  activityId: string
) => {
  const res = await sqlQuery(
    pool,
    `
    SELECT * FROM user_activity_segments WHERE activity_id = $1;
  `,
    [activityId]
  );
  return res.rows?.[0] as UserActivitySegmentsDB | undefined;
};

export const getFullActivitiesByUserId = async (pool: Pool, userId: string) => {
  const query = `
    SELECT 
      a.*, 
      COALESCE(
        row_to_json(s), '{}'::json
      ) AS segment_data
    FROM 
      activities a
    LEFT JOIN 
      user_activity_segments s ON s.activity_id = a.id
    WHERE 
      a.user_id = $1 AND a.deleted = false
    GROUP BY 
      a.id, s.*
    ORDER BY 
      a.data->>'start_date' DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows as FullActivity[];
};

export const getAllScores = async (pool: Pool) => {
  const res = await sqlQuery(
    pool,
    `SELECT 
      id, 
      score, 
      data->>'username' AS username, 
      data->>'firstname' AS firstname, 
      data->>'lastname' AS lastname 
    FROM 
      users
    ORDER BY score DESC
    ;`
  );
  return res.rows as { id: string; score: number }[];
};

export const getUserScore = async (pool: Pool, userId: string) => {
  const res = await sqlQuery(pool, `SELECT * FROM users WHERE id = $1;`, [
    userId,
  ]);
  const user = res.rows?.[0] as UserDB;
  if (user) {
    return {
      id: user.id,
      score: user.score,
      username: user.data.username,
      firstname: user.data.firstname,
      lastname: user.data.lastname,
    } as UserWithScore;
  }
};
