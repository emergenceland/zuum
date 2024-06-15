import { ESMERALDA_TICKET, authenticate, zuAuthPopup } from "@pcd/zuauth";
import Button from "./common/Button";
import Spacer from "./common/Spacer";
import Header from "./common/Header";
import { Athlete, Score } from "../types/types";
import { fetchPost } from "../lib/api";
import { FullActivity } from "../../../server/src/types";
import {
  base64Map,
  polylineFeatures,
  polylinesFeatureCollection,
} from "../lib/renderMap";
import { useState } from "react";

export default function Zupass(props: {
  athlete: Athlete;
  activities: FullActivity[];
  score: Score;
}) {
  const { athlete, activities, score } = props;
  const [issuedPCDSuccess, setIssuedPCDSuccess] = useState<boolean>(false);
  const handleSubscribe = () => {
    window.open(
      `https://zupass.org/#/add-subscription?url=${encodeURI(`${import.meta.env.VITE_SERVER_URL}/feeds`)}`,
      "_blank"
    );
  };

  const handleSignIn = async () => {
    const result = await zuAuthPopup({
      fieldsToReveal: { revealAttendeeSemaphoreId: true },
      watermark: "12345",
      config: [...ESMERALDA_TICKET],
    });

    if (result.type !== "pcd") {
      throw new Error("Unexpected result type");
    }

    const authResult = await authenticate(result.pcdStr, "12345", [
      ...ESMERALDA_TICKET,
    ]);

    if (!authResult.claim.partialTicket.attendeeSemaphoreId) {
      throw new Error("No attendeeSemaphoreId in ticket");
    }

    console.log("Auth result: ", authResult);

    const features = polylineFeatures(activities);

    const base64_image = await base64Map({
      name: athlete.firstname,
      data: polylinesFeatureCollection(features),
      score,
    });

    const payload = {
      pcd: authResult,
      base64_image: base64_image,
      strava_id: athlete.id,
    };

    const issuedPOD = await fetchPost("/issue", payload);
    console.log("Issued POD", issuedPOD);
    if (issuedPOD["success"]) setIssuedPCDSuccess(true);
  };

  return (
    <div className="flex-grow w-screen flex flex-col justify-between p-4">
      <Header />
      <div className="flex flex-col h-full">
        <h1 className="text-3xl font-bold">Zupass</h1>
        <Spacer height={16} />
        <span>
          Save your progress to your{" "}
          <a href="https://zupass.org" className="underline">
            Zupass
          </a>
          !
        </span>
        <Spacer height={16} />
        <span className="mb-2 text-center">
          First, add Zuum to your Zupass. You only need to do this once.
          Afterwards, close the tab and come back to this page.
        </span>
        <Button onClick={handleSubscribe} text="Subscribe" />
        <Spacer height={16} />
        <span className="mb-2 text-center">Then, get your PCD.</span>
        <Button onClick={handleSignIn} text="Get PCD" />
        {issuedPCDSuccess && (
          <>
            <Spacer height={16} />
            <Button
              onClick={() => {
                window.open(`https://zupass.org/#/?folder=Zuum`, "_blank");
              }}
              text="View in Zupass"
            />
          </>
        )}
      </div>
    </div>
  );
}
