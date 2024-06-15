import { ListFeedsResponseValue } from "@pcd/passport-interface";

export const FeedRegistration: ListFeedsResponseValue = {
  providerName: "Zuum",
  providerUrl: process.env.PROVIDER_URL || "http://localhost:3000/feeds",
  feeds: [
    {
      id: "666",
      name: "Zuum",
      description: "How much of Healdsburg have you explored?",
      credentialRequest: {
        signatureType: "sempahore-signature-pcd",
      },
      permissions: [
        {
          folder: "Zuum",
          type: "AppendToFolder_permission",
        },
        {
          folder: "Zuum",
          type: "ReplaceInFolder_permission",
        },
        {
          folder: "Zuum",
          type: "DeleteFolder_permission",
        },
      ],
    },
  ],
};
