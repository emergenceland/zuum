import { Activity, AuthInfo } from "../types/types";

const clientID = import.meta.env.VITE_CLIENT_ID;
console.log(`CLEINT ID: ${clientID}`);

const redirectURL = `${window.location.origin}/redirect`;

export const authScope = "read,activity:read_all";
const isMobileIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
console.log(`IS MOBILE IOS: ${isMobileIOS}`);
export const webAuthUrl = `http://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURL}&approval_prompt=force&scope=${authScope}`;
const iOSMobileAuthUrl = `strava://oauth/mobile/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURL}&approval_prompt=force&scope=${authScope}`;
export const authURL = isMobileIOS ? iOSMobileAuthUrl : webAuthUrl;

console.log(`AUTH URL: ${authURL}`);

export const fetchStravaToken = async (authorizationCode: string) => {
  console.log(`[FETCH] strava token`);
  const url = "https://www.strava.com/oauth/token";

  const clientId = import.meta.env.VITE_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Client ID or Client Secret not found");
  }
  const formData = new FormData();
  formData.append("client_id", clientId);
  formData.append("client_secret", clientSecret);
  formData.append("code", authorizationCode);
  formData.append("grant_type", "authorization_code");

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Success:", data);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};

export const getStravaData = async (accessToken: string, route: string) => {
  console.log(`[FETCH] ${route}`);
  const url = `https://www.strava.com/api/v3/${route}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Success:", data);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};

/* LOCAL STORAGE */
export const getLocalActivities = () => {
  const activitiesString = localStorage.getItem(`testActivities`);
  if (activitiesString) return JSON.parse(activitiesString) as Activity[];
  else return undefined;
};

export const setLocalActivities = (data: Activity[]) => {
  localStorage.setItem(`testActivities`, JSON.stringify(data));
};

export const getLocalAuthInfo = (userId: string): AuthInfo | null => {
  const string = localStorage.getItem(`user-${userId}`);
  return string ? JSON.parse(string) : null;
};

export const getLoggedInUserId = () =>
  localStorage.getItem("loggedInUser") || "";

/* DATE FUNCTIONS */
export const formatDate = (dateString: Date) => {
  const date = new Date(dateString);

  // Get the components of the date
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  // Format hours to 12-hour clock
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  // Format minutes to always be two digits
  const minutesFormatted = minutes < 10 ? "0" + minutes : minutes;

  // Combine the formatted components
  const formattedDate = `${month}/${day}, ${hours}:${minutesFormatted} ${ampm}`;
  return formattedDate;
};

export const areCommaSeparatedStringsEqual = (
  str1: string | null,
  str2?: string
) => {
  if (!str1 || !str2) return false;
  // Split the strings into arrays
  const arr1 = str1.split(",").map((item) => item.trim());
  const arr2 = str2.split(",").map((item) => item.trim());

  // Sort the arrays
  arr1.sort();
  arr2.sort();

  // Join the arrays back into strings and compare
  return arr1.join(",") === arr2.join(",");
};

export const metersToKilometers = (score: number, round?: boolean) => {
  return round ? Math.round(score / 1000) : (score / 1000).toFixed(2);
};

export const getPercent = (score: number, total: number) => {
  return Math.round((score / total) * 100);
};
