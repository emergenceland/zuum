import { useEffect, useMemo, useState } from "react";
import StravaRedirect from "./components/auth/StravaRedirect";
import { LeaderboardResponse, Score } from "./types/types";
import { fetchGet } from "./lib/api";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import HomeWithNav from "./components/HomeWithNav";
import MapView from "./components/MapView";
import Leaderboard from "./components/Leaderboard";
import Zupass from "./components/Zupass";
import About from "./components/About";
import { getLocalAuthInfo } from "./lib/utils";
import { FullActivity } from "../../server/src/types";
import LoggedOut from "./components/auth/LoggedOut";

const route = window.location.pathname;
console.log({ route });

function App() {
  console.log(`👋 LOGGEDIN is re-rendering`);
  const userId = localStorage.getItem("loggedInUser");

  const [allScores, setAllScores] = useState<LeaderboardResponse>({
    scores: [],
    totalScore: 0,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!userId);
  const [activities, setActivities] = useState<FullActivity[]>([]);
  const [score, setScore] = useState<Score | undefined>(undefined);

  const authInfo = useMemo(() => {
    if (!userId) return undefined;
    return getLocalAuthInfo(userId);
  }, [userId]);

  const getAllScores = async () => {
    try {
      const allScores = (await fetchGet("/scores", "")) as LeaderboardResponse;
      if (!allScores) throw new Error("Could not get scores.");
      setAllScores(allScores);
    } catch (e: any) {
      console.error(e);
    }
  };

  /* REFRESHING ACTIVITIES AND SCORE */
  const [refreshingActivities, setRefreshingActivities] = useState(false);

  const refreshScore = async (userId: string) => {
    try {
      const newScore = await fetchGet("/score", userId);
      if (!newScore) throw new Error("Could not fetch score.");
      localStorage.setItem(`score-${userId}`, JSON.stringify(newScore));
      setScore(newScore);
    } catch (e: any) {
      console.error(e);
    }
  };

  const refreshActivities = async () => {
    try {
      if (!userId)
        throw new Error("Cannot refresh activities: user id does not exist");
      setRefreshingActivities(true);
      const newActivities = (await fetchGet(
        "/activities",
        userId
      )) as FullActivity[];
      await refreshScore(userId);
      // reset local storage items
      localStorage.setItem(
        `activities-${userId}`,
        JSON.stringify(newActivities)
      );
      // reset data in memory
      setActivities(newActivities);
    } catch (e: any) {
      console.error(e);
    } finally {
      setRefreshingActivities(false);
    }
  };

  // Once userId is defined, set activities and score
  useEffect(() => {
    if (!userId) return;
    const activitiesRaw = localStorage.getItem(`activities-${userId}`);
    const parsedActivities = activitiesRaw
      ? (JSON.parse(activitiesRaw) as FullActivity[])
      : [];
    setActivities(parsedActivities);
    const scoreRaw = localStorage.getItem(`score-${userId}`);
    const parsedScore = scoreRaw ? (JSON.parse(scoreRaw) as Score) : undefined;
    setScore(parsedScore);
  }, [userId]);

  // Currently we are getting all scores on mount, just stored in memory
  useEffect(() => {
    getAllScores();
  }, []);

  const renderLoggedIn = isLoggedIn && authInfo && score;

  const router = createBrowserRouter([
    {
      path: "/",
      element: <HomeWithNav />,
      children: [
        {
          path: "/",
          element: renderLoggedIn ? (
            <MapView
              athlete={authInfo.athlete}
              activities={activities}
              score={score}
              refreshActivities={refreshActivities}
              refreshingActivities={refreshingActivities}
            />
          ) : (
            <LoggedOut toAccess={"your map"} allScores={allScores} />
          ),
        },
        {
          path: "leaderboard",
          element: (
            <Leaderboard
              isLoggedIn={isLoggedIn}
              allScores={allScores}
              getAllScores={getAllScores}
            />
          ),
        },
        {
          path: "zupass",
          element: renderLoggedIn ? (
            <Zupass
              athlete={authInfo.athlete}
              activities={activities}
              score={score}
            />
          ) : (
            <LoggedOut toAccess={"your Zupass"} allScores={allScores} />
          ),
        },
        {
          path: "about",
          element: (
            <About isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
          ),
        },
      ],
    },
  ]);

  if (route === "/redirect") return <StravaRedirect />;
  return <RouterProvider router={router} />;
}

export default App;
