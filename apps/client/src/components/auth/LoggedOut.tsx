import { webAuthUrl } from "../../lib/utils";
import { LeaderboardResponse } from "../../types/types";
import LeaderboardTable from "../LeaderboardTable";
import ConnectButton from "./ConnectButton";

export default function LoggedOut({
  toAccess,
  allScores,
}: {
  toAccess: string;
  allScores: LeaderboardResponse;
}) {
  return (
    <div
      className="flex flex-col justify-end w-screen px-4 landing"
      style={{ height: `calc(100% - 54px)` }}
    >
      <div className="w-full flex-grow flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold font-space">ミZuum</h1>
        <p className="text-center font-light">{`Connect Strava to see ${toAccess}`}</p>
        <ConnectButton />
        <a className="underline" href={webAuthUrl}>
          Or connect via browser
        </a>
        <p className="px-2 text-center italics text-sm">
          You have until <span className="font-bold"> June 30th</span> to
          explore Healdsburg.
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
      </div>
      <div
        className="flex flex-col pb-4"
        style={{ height: "55%", maxHeight: "55%" }}
      >
        <h1 className="text-lg font-bold">Current leaderboard:</h1>
        <div className="flex flex-col flex-grow overflow-scroll">
          <LeaderboardTable allScores={allScores} />
        </div>
      </div>
    </div>
  );
}
