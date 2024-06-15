import { Pool } from "pg";
import { updateUser } from "./db";
import { RefreshResponse, User, UserDB } from "./types";
import dotenv from "dotenv";

dotenv.config();

export const getStravaData = async (
  user: UserDB,
  route: string,
  pool: Pool
) => {
  let localUser = user;

  // Check if access token has expired
  const expiredDate = new Date(user.data.expires_at * 1000);
  const now = new Date();
  const isExpired = expiredDate < now;

  // Check if token has expired
  console.log(
    `IS`,
    expiredDate.toLocaleString(),
    `After`,
    now.toLocaleString(),
    `${isExpired ? "❌" : "✅"}`
  );

  if (isExpired) {
    const res = await refreshStravaToken(user);
    if (!res) throw new Error(`Failed to refresh token`);
    console.log(`REFRESHED TOKEN`, res);
    localUser = await updateUser(pool, {
      id: user.id,
      data: {
        ...user.data,
        ...res,
      },
    });
    console.log(`OLD USER,`, user);
    console.log(`UPDATED USER,`, localUser);
  }

  console.log(`[FETCH] ${route}`);
  const url = `https://www.strava.com/api/v3/${route}`;
  const { access_token } = localUser.data;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};

const url = "https://www.strava.com/api/v3/oauth/token";
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

const refreshStravaToken = async (user: UserDB) => {
  try {
    const payload = {
      client_id,
      client_secret,
      grant_type: "refresh_token",
      refresh_token: user.data.refresh_token,
    };
    console.log(`PAYLOAD`, payload);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Success:", data);
    return data as RefreshResponse;
  } catch (error) {
    console.error("Error:", error);
  }
};
