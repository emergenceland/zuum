import { useEffect, useMemo, useState } from "react";
import { Athlete, Score } from "../types/types";
import { BaseMap } from "./BaseMap";
import type { FullActivity } from "../../../server/src/types";
import Spacer from "./common/Spacer";
import ActivityList from "./ActivityList";
import { formatDate, metersToKilometers } from "../lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { DARK } from "../lib/styles";
import Header from "./common/Header";
import { useNavigate } from "react-router-dom";

type MapViewProps = {
  athlete: Athlete;
  score: Score;
  activities: FullActivity[];
  refreshActivities: () => void;
  refreshingActivities: boolean;
};

export default function MapView(props: MapViewProps) {
  const {
    athlete,
    score,
    activities,
    refreshActivities,
    refreshingActivities,
  } = props;

  const [showPolylines, setShowPolylines] = useState(true);
  const [showUntravelled, setShowUntravelled] = useState(true);
  const [showTravelled, setShowTravelled] = useState(true);
  const [showActivityList, setShowActivityList] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    refreshActivities();
  }, []);

  const percentCovered = useMemo(() => {
    if (!score) return 0;
    return Math.round((score.score / score.totalScore) * 100);
  }, [score]);

  const mostRecentActivity = useMemo(() => {
    if (activities.length === 0) {
      return undefined;
    } else {
      return formatDate(new Date(activities[0].data.start_date));
    }
  }, [activities]);

  return (
    <div className="flex-grow relative w-screen flex flex-col items-center p-4">
      <Header />
      <div className="w-full flex flex-col text-base px-2">
        <p>
          <span className="font-bold">{athlete.firstname}</span>
          {`, you've covered `}
          <span className="font-bold font-space text-lg">{`${percentCovered}%`}</span>
          {` of Healdsburg.`}
        </p>
        <p>
          {`That's `}
          <span className="font-bold font-space text-lg">{`${metersToKilometers(score.score)}`}</span>
          {` unique kms.`}
        </p>
      </div>
      <Spacer height={8} />
      <div className="flex-grow w-full flex flex-col items-center justify-center">
        <BaseMap
          athlete={athlete}
          activities={activities}
          score={score}
          selectedActivity={selectedActivity}
          setSelectedActivity={setSelectedActivity}
          setShowActivityList={setShowActivityList}
          showPolylines={showPolylines}
          showUntravelled={showUntravelled}
          showTravelled={showTravelled}
        />
      </div>
      <Spacer height={16} />
      <button onClick={() => navigate("/about")}>
        <p className="text-sm underline">Don't see your activities?</p>
      </button>
      <Spacer height={4} />
      <div className="flex flex-row w-full justify-center items-center text-sm px-1">
        <button
          onClick={refreshActivities}
          style={{
            animation: refreshingActivities
              ? "spin 1s ease-in-out infinite"
              : "none",
          }}
        >
          <FontAwesomeIcon icon={faRefresh} size={"lg"} color={DARK} />
        </button>
        <Spacer width={8} />
        {mostRecentActivity && (
          <p>{`${activities.length} activities (most recent: ${mostRecentActivity})`}</p>
        )}
      </div>
      {showActivityList && (
        <ActivityList
          showTravelled={showTravelled}
          showUntravelled={showUntravelled}
          showPolylines={showPolylines}
          setShowUntravelled={setShowUntravelled}
          setShowTravelled={setShowTravelled}
          setShowPolylines={setShowPolylines}
          setSelectedActivity={setSelectedActivity}
          selectedActivity={selectedActivity}
          activities={activities}
          onClose={() => setShowActivityList(false)}
          onRefresh={refreshActivities}
          refreshingActivities={refreshingActivities}
        />
      )}
    </div>
  );
}
