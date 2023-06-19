import express, { Request, Response } from "express";
import request, { get } from "request-promise-native";
import * as dotenv from "dotenv";
import { Prisma, User } from "@prisma/client";
import {
  findUserByEmail,
  findUserById,
  findUserByUsername,
} from "../users/user.services";
import db from "../../utils/db";
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";
import * as cron from "node-cron";

cron.schedule("30 * * * *", async () => {
  console.log("running a task every day");
  const users = await db.user.findMany({
    where: {
      spotifyRefreshToken: {
        not: null,
      },
    },
  });

  for (const user of users) {
    console.log("USER", user);


    const tokenResponse = await fetch(
      "http://localhost:5173/api/spotifyLogin/refresh-token",
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refreshToken: user.spotifyRefreshToken,
          userId: user.id,
        }),
      }
    ).then((response) => response.json());

    const accessToken = tokenResponse.access_token;

    console.log("ACCESS TOKEN", accessToken);
  }
});

const app = express();

// Replace these with your own credentials from the Spotify Developer Dashboard
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

app.put(
  "/save/refresh",
  authStatusMiddleware,
  async (req: Request, res: Response) => {
    const tokenData = req.body.tokenData;
    const refreshToken: string = req.body.request.refreshToken;
    const accessToken: string = req.body.request.accessToken;
    const userId = tokenData.userId;
    const user = await findUserById(userId)
    if (user) {
      await db.user.update({
        where: {
          id: userId,
        },
        data: {
          spotifyRefreshToken: refreshToken,
          spotifyAccessToken: accessToken,
        },
      });
    }
    res.json("Refresh token saved")
  }
);

// Refresh the access token
app.put("/refresh-token", async function (req, res) {
  const userId = req.body.userId;
  try {
    let user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (user) {
      const refreshToken = user.spotifyRefreshToken;

      const authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
        form: {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
        json: true,
      };

      request.post(authOptions, async function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var access_token = body.access_token;
          await db.user.update({
            where: {
              id: userId,
            },
            data: {
              spotifyAccessToken: access_token,
            },
          });
          res.send({
            access_token: access_token,
          });
        }
      });
    }
  } catch (error) {
    console.error("Error getting tokens:", error);
    res.status(400).send("Error getting tokens");
  }
});

export default app;
