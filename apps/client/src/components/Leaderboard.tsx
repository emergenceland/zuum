import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LeaderboardResponse } from "../types/types";
import Spacer from "./common/Spacer";
import { faCheck, faRefresh } from "@fortawesome/free-solid-svg-icons";
import { DARK } from "../lib/styles";
import { useState } from "react";
import LeaderboardTable from "./LeaderboardTable";
import Header from "./common/Header";

type LeaderboardProps = {
  isLoggedIn: boolean;
  allScores: LeaderboardResponse;
  getAllScores: () => Promise<void>;
};

const userId = localStorage.getItem("loggedInUser");
export default function Leaderboard(props: LeaderboardProps) {
  const { isLoggedIn, allScores, getAllScores } = props;

  const me = allScores.scores.find((s) => s.id === userId);
  const rank = me ? allScores.scores.indexOf(me) + 1 : 0;

  /* REFRESH SCORES */
  const [refreshingScores, setRefreshingScores] = useState(false);
  const [refreshedScores, setRefreshedScores] = useState(false);

  const handleRefreshScores = async () => {
    try {
      setRefreshingScores(true);
      await getAllScores();
      setRefreshedScores(true);
      setTimeout(() => setRefreshedScores(false), 2000);
    } catch (e) {
      console.error("Error refreshing scores");
    } finally {
      setRefreshingScores(false);
    }
  };

  return (
    <div
      className="flex-grow w-screen py-4 flex flex-col"
      style={{ height: `calc(100% - 54px)` }}
    >
      <Header />
      <Spacer height={12} />
      <p className="px-2 text-center italics text-sm">
        You have until <span className="font-bold"> June 30th</span> to explore.
      </p>
      <p className="px-2 text-center italics text-sm">
        {" "}
        Get at least <span className="font-bold">10 km</span> to win a 🎁 from{" "}
        <span className="underline">
          <a
            href="https://www.instagram.com/healdsburgrunningcompany"
            target="_blank"
          >
            HRC!
          </a>
        </span>
      </p>
      <Spacer height={24} />
      {isLoggedIn && (
        <>
          <p className="px-4 text-lg text-center">
            {`You're ranked `}
            <span className="font-bold font-space text-2xl">{rank}</span>
            {` out of `}
            <span className="font-bold font-space text-2xl">
              {allScores.scores.length}
            </span>
            {` explorers.`}
          </p>
          <Spacer height={24} />
        </>
      )}
      <div className="flex flex-col flex-grow flex-shrink border-t border-dark overflow-scroll">
        <LeaderboardTable allScores={allScores} />
      </div>
      <Spacer height={16} />
      <button
        className="w-full px-4 flex flex-row justify-center items-center active:opacity-50 text-sm"
        onClick={handleRefreshScores}
      >
        <div
          style={{
            width: 24,
            animation: refreshingScores
              ? "spin 1s ease-in-out infinite"
              : "none",
          }}
        >
          <FontAwesomeIcon
            icon={refreshedScores ? faCheck : faRefresh}
            size={"lg"}
            color={DARK}
          />
        </div>
        <Spacer width={4} />
        <p>Refresh leaderboard</p>
      </button>
    </div>
  );
}
