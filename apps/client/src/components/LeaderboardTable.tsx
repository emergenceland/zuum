import { getPercent, metersToKilometers } from "../lib/utils";
import { LeaderboardResponse } from "../types/types";
import Spacer from "./common/Spacer";

type LeaderboardTableProps = {
  allScores: LeaderboardResponse;
};

const userId = localStorage.getItem("loggedInUser");
export default function LeaderboardTable(props: LeaderboardTableProps) {
  const { allScores } = props;

  const me = allScores.scores.find((s) => s.id === userId);

  return allScores.scores.map((s, i) => {
    const scoreInKm = metersToKilometers(s.score);
    const isMe = me && s.id === me.id;
    const renderStar = s.score > 10000;

    return (
      <div key={i}>
        <div
          className="w-full flex flex-row items-center px-4 py-2"
          style={{ backgroundColor: isMe ? "#ffffff80" : "transparent" }}
        >
          <h1 className="text-lg font-bold">{`${i + 1}.`}</h1>
          <Spacer width={16} />
          <div className="flex flex-row flex-grow justify-between text-md">
            <p className="font-bold">
              {renderStar && <span className="mr-3">⭐️</span>}
              {s.firstname}
            </p>
            <p>{`${scoreInKm} km (${getPercent(s.score, allScores.totalScore)}%)`}</p>
          </div>
        </div>
        <div className="w-full h-[1px] bg-dark" />
      </div>
    );
  });
}
