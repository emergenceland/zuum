import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FullActivity } from "../../../server/src/types";
import { formatDate } from "../lib/utils";
import { faRefresh, faX } from "@fortawesome/free-solid-svg-icons";
import Spacer from "./common/Spacer";
import Button from "./common/Button";
import { Dispatch, SetStateAction, useMemo } from "react";
import { LIGHT } from "../lib/styles";

type ActivityListProps = {
  showUntravelled: boolean;
  setShowUntravelled: Dispatch<SetStateAction<boolean>>;
  showPolylines: boolean;
  setShowPolylines: Dispatch<SetStateAction<boolean>>;
  showTravelled: boolean;
  setShowTravelled: Dispatch<SetStateAction<boolean>>;
  selectedActivity: string;
  setSelectedActivity: Dispatch<SetStateAction<string>>;
  activities: FullActivity[];
  onClose: () => void;
  onRefresh: () => void;
  refreshingActivities: boolean;
};

export default function ActivityList(props: ActivityListProps) {
  const {
    showUntravelled,
    setShowUntravelled,
    showPolylines,
    setShowPolylines,
    showTravelled,
    setShowTravelled,
    selectedActivity,
    setSelectedActivity,
    activities,
    onClose,
    onRefresh,
    refreshingActivities,
  } = props;

  const mostRecentActivity = useMemo(() => {
    if (activities.length === 0) {
      return undefined;
    } else {
      return formatDate(new Date(activities[0].data.start_date));
    }
  }, [activities]);

  const handleClickActivity = (id: string) => {
    setSelectedActivity(id);
    onClose();
  };

  return (
    <>
      <div
        className="absolute w-screen h-content bg-black opacity-50 top-0 left-0 right-0 bottom-0"
        style={{ zIndex: 3 }}
        onClick={onClose}
      />
      <div
        className="absolute top-0 left-1/4 w-3/4 h-content bg-white"
        style={{ zIndex: 4 }}
      >
        <div className="relative h-full w-full py-4 flex flex-col">
          <div className="w-full flex flex-row justify-between px-4">
            <h1 className="text-xl font-bold">Layers</h1>
            <button className="px-2" onClick={onClose}>
              <FontAwesomeIcon icon={faX} />
            </button>
          </div>
          <Spacer height={16} />
          <div className="flex flex-col px-4 text-md">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showPolylines}
                onChange={() => setShowPolylines(!showPolylines)}
                className="checkbox border-2 border-[#BE9EFF] mr-2 checked:bg-[#BE9EFF]"
                style={{ width: 20, height: 20 }}
              />
              My activities
            </label>
            <Spacer height={8} />
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showTravelled}
                onChange={() => setShowTravelled(!showTravelled)}
                className="checkbox border-2 border-[#8144FF] checked:bg-[#8144FF] mr-2"
                style={{ width: 20, height: 20 }}
              />
              Explored streets
            </label>
            <Spacer height={8} />
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showUntravelled}
                onChange={() => setShowUntravelled(!showUntravelled)}
                className="checkbox border-2 border-[#B1DBC5] checked:bg-[#B1DBC5] mr-2"
                style={{ width: 20, height: 20 }}
              />
              Unexplored streets
            </label>
          </div>
          <Spacer height={24} />
          <div className="w-full flex flex-row gap-2 items-center px-4">
            <h1 className="text-xl font-bold">Activities</h1>
            <p className="font-space">{`(${activities.length})`}</p>
          </div>
          <Spacer height={8} />
          <div className="flex flex-shrink flex-col overflow-scroll items-center h-full">
            <div className="w-full flex flex-col justify-between">
              {activities.map((a: FullActivity) => {
                const isFlagged = a.data.flagged;
                const hasPolyline = !!a.data.map.summary_polyline;
                const hasSegments =
                  a.segment_data && a.segment_data?.segments?.length > 0;
                const dist = (a.data.distance / 1000).toFixed(1);
                const message = isFlagged
                  ? "Flagged"
                  : !hasPolyline
                    ? "No GPS data"
                    : !hasSegments
                      ? "Not in area"
                      : `${dist}km`;
                return (
                  <div
                    className="w-full flex flex-row gap-4 text-dark items-center border-b border-dark px-4 py-2 text-sm"
                    style={{
                      opacity: hasPolyline && hasSegments ? 1 : 0.5,
                      backgroundColor:
                        selectedActivity === a.id ? LIGHT : "#ffffff",
                    }}
                    key={a.id}
                    onClick={() => {
                      if (isFlagged || !hasPolyline || !hasSegments) return;
                      handleClickActivity(a.id);
                    }}
                  >
                    <div className="flex flex-col flex-grow">
                      <div className="flex flex-row w-full justify-between gap-4">
                        <p className="flex-grow-1 font-bold">{a.data.name}</p>
                        <p className="flex-shrink-0 font-bold">{message}</p>
                      </div>
                      <p className="text-dark opacity-75">
                        {formatDate(new Date(a.data.start_date))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Spacer height={16} />
          <div className="w-full flex flex-col justify-center text-center text-sm items-center">
            {mostRecentActivity && (
              <p className="font-med">
                <span className="font-bold">Most recent:</span>{" "}
                {mostRecentActivity}
              </p>
            )}

            <Spacer height={8} />
            <Button
              icon={<FontAwesomeIcon icon={faRefresh} color="#ffffff" />}
              text="Refresh activities"
              loading={refreshingActivities}
              onClick={onRefresh}
            />
          </div>
        </div>
      </div>
    </>
  );
}
