import type { ActivityDB } from "../../../server/src/types";
import { formatDate } from "../lib/utils";

type ActivitiesViewProps = {
  activities: ActivityDB[];
};
export default function ActivitiesView(props: ActivitiesViewProps) {
  const { activities } = props;

  return (
    <div className="w-screen flex flex-col flex-grow flex-shrink overflow-hidden p-4">
      <h1 className="text-3xl font-bold">Activities</h1>
      <div className="flex flex-shrink flex-col gap-4 overflow-scroll h-full justify-between p-4">
        {activities.map((a: ActivityDB) => {
          const shownInMap = !!a.data.map.summary_polyline;
          return (
            <div
              className="w-full flex flex-row gap-4 text-dark whitespace-nowrap"
              style={{ opacity: shownInMap ? 1 : 0.5 }}
              key={a.id}
            >
              <p className="uppercase font-bold">{a.data.sport_type}</p>
              <p>{formatDate(new Date(a.data.start_date))}</p>
              <p>{`${a.data.name}, (${a.data.distance}m)`}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
