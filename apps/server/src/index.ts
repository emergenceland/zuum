// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import {
  getActivitySegmentsByUserId,
  getAllActivitySegments,
  getAllScores,
  getDB,
  getFullActivitiesByUserId,
  getPodBySemaphoreId,
  getUserById,
  getUserScore,
  insertPod,
  insertUser,
  updateUserScore,
} from "./db";
import { AuthResponse, PodUserDB, UserDB, UserWithScore } from "./types";
import {
  ZKEdDSAEventTicketPCD,
  ZKEdDSAEventTicketPCDPackage,
} from "@pcd/zk-eddsa-event-ticket-pcd";
import {
  calculateAllScores,
  calculateUserScore,
  getTotalScore,
  metersToKilometers,
  refreshUserActivities,
  runAlgoOnActivities,
  updateScore,
} from "./server_algo";
import { POD, podEntriesFromSimplifiedJSON } from "@pcd/pod";
import { PODPCD, PODPCDPackage } from "@pcd/pod-pcd";
import {
  PollFeedRequest,
  PollFeedResponseValue,
  verifyCredential,
} from "@pcd/passport-interface";
import { SerializedPCD } from "@pcd/pcd-types";
import { SemaphoreSignaturePCDPackage } from "@pcd/semaphore-signature-pcd";
import { FeedRegistration } from "./feed";

dotenv.config();

const DEV_PRIVATE_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const PRIVATE_KEY = process.env.PRIVATE_KEY || DEV_PRIVATE_KEY;

const main = async () => {
  const app: Express = express();
  app.use(cors());
  app.use(express.json());
  const port = process.env.PORT || 3000;

  console.log(`[SERVER] Starting services...`);
  const pool = await getDB();

  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET)
    throw new Error("Missing Strava client ID or secret");

  app.get("/", async (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });

  // Get Activities by user Id
  app.get("/activities", async (req: Request, res: Response) => {
    try {
      // Extract user ID from bearer token
      const auth = req.headers.authorization;
      const userId = auth?.split(" ")[1];
      if (!userId) throw new Error("No user ID provided");
      const user = await getUserById(pool, userId);
      if (!user) throw new Error("No user found");

      const updatedActivities = await refreshUserActivities(pool, user);

      // Save user segments to database
      await runAlgoOnActivities(pool, updatedActivities, userId);

      // Get the user's known activities
      const fullActivities = await getFullActivitiesByUserId(pool, user.id);
      const activitiesWithSegments = fullActivities.filter(
        (a) => a.segment_data?.segments && a.segment_data.segments.length > 0
      );
      console.log(
        `FULL ACTIVITIES`,
        fullActivities.map((a) => a.data.name)
      );

      await updateScore(pool, userId);

      console.log(
        `FOUND ${fullActivities.length} activities and ${activitiesWithSegments.length} activities with segments`
      );

      res.json(fullActivities);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error processing user info");
    }
  });

  app.get("/score", async (req: Request, res: Response) => {
    try {
      // Extract user ID from bearer token
      const auth = req.headers.authorization;
      const userId = auth?.split(" ")[1];
      if (!userId) throw new Error("No user ID provided");
      const user = await getUserById(pool, userId);
      if (!user) throw new Error("No user found");
      await updateScore(pool, userId);
      const totalScore = getTotalScore();
      const userWithScore = await getUserScore(pool, userId);
      res.json({ ...userWithScore, totalScore });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error processing user info");
    }
  });

  app.post("/refresh-scores", async (req: Request, res: Response) => {
    try {
      const allActivites = await getAllActivitySegments(pool);
      const allScores = calculateAllScores(allActivites);
      allScores.forEach(async (score, userId) => {
        await updateUserScore(pool, userId, score);
      });
      const scores = await getAllScores(pool);
      res.json(scores);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error refreshing scores");
    }
  });

  app.get("/scores", async (req: Request, res: Response) => {
    try {
      const scores = await getAllScores(pool);
      const totalScore = getTotalScore();
      res.json({ scores, totalScore });
    } catch (error) {
      console.error(error);
      res.status(500).send("Fetching scores");
    }
  });

  // Create user and generate initial score during login
  app.post("/user", async (req: Request, res: Response) => {
    try {
      const auth = req.body as AuthResponse;
      console.log(`[SERVER] POST /user`, auth);
      if (!auth) throw new Error("No auth data provided");
      const athlete = auth.athlete;
      if (!athlete) throw new Error("No athlete data provided");

      let user = await getUserById(pool, athlete.id.toString());
      const name = athlete.username || athlete.firstname;
      console.log(`[SERVER] [${name}] existingUser`, user);

      if (!user) {
        const id: string = athlete.id.toString();
        const { refresh_token, access_token, expires_at } = auth;
        const { firstname, lastname, username } = athlete;
        user = await insertUser(pool, {
          id,
          data: {
            id,
            username: username || "",
            firstname,
            lastname,
            refresh_token,
            access_token,
            expires_at,
          },
        });
        console.log(`[${name}] INSERTED`, user);
      }
      const updatedActivities = await refreshUserActivities(pool, user);

      // Save user segments to database
      await runAlgoOnActivities(pool, updatedActivities, user.id);

      await updateScore(pool, user.id);

      const fullActivities = await getFullActivitiesByUserId(pool, user.id);

      res.json(fullActivities);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error processing user info");
    }
  });

  app.get("/feeds", async (req, res) => {
    res.status(200).json(FeedRegistration);
  });

  app.post("/feeds", async (req, res) => {
    const request: PollFeedRequest = req.body;

    try {
      const verifiedCredential = await verifyCredential(request.pcd!);
      const pod: PodUserDB | undefined = await getPodBySemaphoreId(
        pool,
        verifiedCredential.semaphoreId
      );

      if (!pod) {
        res.status(400).json({ error: "Pod for semaphore ID not found" });
        return;
      }

      const data = pod.proof as unknown as SerializedPCD;

      var result: PollFeedResponseValue = {
        actions: [],
      };

      result.actions.push({
        folder: "Zuum",
        type: "DeleteFolder_action",
        recursive: false,
      });

      result.actions.push({
        folder: "Zuum",
        type: "AppendToFolder_action",
        pcds: [data],
      });

      res.status(200).json(result);
    } catch (e) {
      console.error(e);
      res.status(400).json({ error: `Couldn't verify credential: ${e}` });
      return;
    }
  });

  // link a semaphore ID with a strava ID, then create+save POD
  app.post("/issue", async (req, res) => {
    var inputs: {
      pcd: ZKEdDSAEventTicketPCD;
      strava_id: string;
      base64_image: string;
    } = req.body;

    const user: UserDB | undefined = await getUserById(pool, inputs.strava_id);

    if (!user) {
      res.status(400).json({ error: "User not found" });
      return;
    }

    // make sure score is up to date before we issue
    try {
      const updatedActivities = await refreshUserActivities(pool, user);
      await runAlgoOnActivities(pool, updatedActivities, user.id);
      const score = await updateScore(pool, user.id);
      const totalScore = getTotalScore();

      if (score === undefined) {
        res.status(500).send("Error processing user info, no score found");
        return;
      }

      const verified = await ZKEdDSAEventTicketPCDPackage.verify(inputs.pcd);
      if (!verified) {
        res.status(500).json({ error: "Couldn't verify PCD" });
        return;
      }

      const semaphore_id = inputs.pcd.claim.partialTicket.attendeeSemaphoreId;
      if (!semaphore_id) {
        res.status(500).json({ error: "No semaphore id" });
        return;
      }

      const cleanScore = metersToKilometers(score);
      const percentage = ((score * 100) / totalScore).toFixed(1);

      var jsonString = JSON.stringify({
        zupass_display: "collectable",
        zupass_title: `Zuum Score - ${cleanScore} km`,
        zupass_description: `I ran ${cleanScore} km (${percentage}%) of Healdsburg! Try to beat me at Zuum.gg`,
        raw_score: score,
        total_score: totalScore,
        zuum: "https://zuum.gg",
        zupass_image_url:
          inputs?.base64_image ?? "https://picsum.photos/900/1530",
        owner: semaphore_id,
      });

      const hash = crypto.createHash("sha256");
      hash.update(jsonString);
      const contentUUID = hash.digest("hex");

      const newPOD = new PODPCD(
        contentUUID,
        POD.sign(podEntriesFromSimplifiedJSON(jsonString), PRIVATE_KEY)
      );
      const serialized = await PODPCDPackage.serialize(newPOD);
      console.log("Serialized pod: ", serialized);

      const pod = await insertPod(pool, {
        semaphore_id: semaphore_id,
        strava_id: inputs.strava_id,
        proof: JSON.stringify(serialized),
      });

      console.log(`INSERTED a pod`);

      res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e });
      return;
    }
  });

  app.listen(port, () => {
    console.log(`[SERVER] running on port ${port}`);
  });
};

main();
