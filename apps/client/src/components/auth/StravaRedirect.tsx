import { useEffect, useState } from "react";
import {
  areCommaSeparatedStringsEqual,
  authScope,
  fetchStravaToken,
} from "../../lib/utils";
import type { AuthInfo, Score } from "../../types/types";
import { fetchGet, fetchPost } from "../../lib/api";
import { FullActivity } from "../../../../server/src/types";
import Button from "../common/Button";
import Spacer from "../common/Spacer";

export default function StravaRedirect() {
  const [localError, setLocalError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [activities, setActivities] = useState<FullActivity[]>([]);
  const [authInfo, setAuthInfo] = useState<AuthInfo | undefined>(undefined);

  const [showConfirm, setShowConfirm] = useState(false);

  const fetchAuthInfo = async (code: string) => {
    try {
      console.log(`sending code to strava: ${code}`);
      setLoadingProfile(true);
      const authInfo = (await fetchStravaToken(code)) as AuthInfo;
      if (!authInfo) throw new Error("Could not get auth info.");
      const userId = authInfo.athlete.id;
      setAuthInfo(authInfo);
      localStorage.setItem(`user-${userId}`, JSON.stringify(authInfo));
      console.log(`[AUTH INFO RECEIEVED FOR ${authInfo.athlete.firstname} ✅]`);
      console.log({ authInfo });
      return authInfo;
    } catch (e: any) {
      console.error(e);
      setLocalError(e.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchActivities = async (authInfo: AuthInfo) => {
    try {
      setLoadingActivities(true);
      // To Do: check local storage to see if activities are already there? avoids extra strava fetch
      // Activities are a response from auth info
      const activities = (await fetchPost("/user", authInfo)) as FullActivity[];
      setLoadingActivities(false);
      if (!activities) throw new Error("Could not fetch activities.");
      console.log(`FETCHED ${activities.length} ACTIVITIES`);
      setActivities(activities);
      localStorage.setItem(
        `activities-${authInfo?.athlete.id}`,
        JSON.stringify(activities)
      );
      await fetchScore(authInfo?.athlete.id);
      setActivitiesLoaded(true);
    } catch (e: any) {
      console.error(e);
      setLocalError(e.message);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchScore = async (userId?: string) => {
    try {
      console.log("[FETCHING SCORE...]");
      if (!userId) throw new Error("No user");
      const score = (await fetchGet("/score", userId)) as Score;
      if (!score) throw new Error("Could not fetch score.");
      localStorage.setItem(`score-${userId}`, JSON.stringify(score));
    } catch (e: any) {
      console.error(e);
    }
  };

  // Once user confirms, log them in
  const handleConfirmLogin = () => {
    if (!authInfo) {
      setLocalError("Could not log in. Return home and try again.");
      return;
    }
    const userId = authInfo.athlete.id;
    localStorage.setItem("loggedInUser", userId);
    window.location.replace(window.origin);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    console.log(`PARAMS`, params);
    const code = params.get("code");
    const scope = params.get("scope");
    const correctScope = areCommaSeparatedStringsEqual(scope, authScope);

    // If no query params, return home
    if (!code || !scope) window.location.replace(window.origin);

    if (params.get("error") || (scope && !correctScope))
      setLocalError("Invalid scope");
    if (code && correctScope)
      fetchAuthInfo(code).then((authInfo) => {
        if (!authInfo) return;
        fetchActivities(authInfo).then(() => {
          window.history.replaceState({}, document.title, url.pathname);
          setShowConfirm(true);
        });
      });
  }, []);

  return (
    <div className="h-content w-screen flex flex-col items-center justify-center font-bold text-dark">
      {loadingProfile && <p>Loading Profile...</p>}
      {authInfo && <p>{`Hi ${authInfo.athlete.firstname} 👋`}</p>}
      <Spacer height={16} />
      {loadingActivities ? (
        <p>Loading Activities...</p>
      ) : activitiesLoaded ? (
        <p>{`Found ${activities.length} activities`}</p>
      ) : null}
      <Spacer height={16} />
      {localError && (
        <>
          <p className="text-sm text-red-700">{`Error: ${localError}`}</p>
          <Spacer height={16} />
          <Button
            text="Return home"
            onClick={() => window.location.replace(window.location.origin)}
          />
          <Spacer height={16} />
        </>
      )}
      {showConfirm && !localError && (
        <Button text="Show me the map" onClick={handleConfirmLogin} />
      )}
    </div>
  );
}
