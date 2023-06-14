import * as dotenv from "dotenv";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import auth from "./api/auth/auth.routes";
import { debug } from "console";
import { authStatusMiddleware } from "./api/auth/authMiddleware";
import users from "./api/users/user.routes";
import SpotifyWebApi from "spotify-web-api-node";
import { RequestAccessToken } from "./api/spotifyLogin/spotify.routes";
import spotifylogin from "./api/spotifyLogin/spotifylogin";
import topGlobalSongs from "./api/spotifyMainInfo/topGlobalSongs";
import db from "./utils/db";
import songsPosting from "./api/songsPosting/songsPosting";
import dataXmlPdf from "./api/dataXmlPdf/dataXmlPdf";
import scrobble, { getRecentlyPlayed } from "./api/scrobble/scrobble";
import monthlyDashboard from "./api/dashboard/monthlyDashboard";
import halfYearDashboard from "./api/dashboard/halfYearDashboard";
import allTimeDashboard from "./api/dashboard/allTimeDashboard";
import genres from "./api/dashboard/genres";

const app: Express = express();

dotenv.config({ path: ".env" });

const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/spotifylogin", spotifylogin);
app.use("/api/spotifyMainInfo", topGlobalSongs);
app.use("/api/songsPosting", songsPosting);
app.use("/api/dataXmlPdf", dataXmlPdf);
app.use("/api/scrobble", scrobble);
app.use("/api/dashboard", monthlyDashboard);
app.use("/api/dashboard", halfYearDashboard);
app.use("/api/dashboard", allTimeDashboard);
app.use("/api/dashboard", genres);

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "We did it!" });
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

RequestAccessToken();

const onBoot = async () => {
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
    console.log("Spotify refresh token", user.spotifyRefreshToken);

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
  }

  const otherUsers = await db.user.findMany({
    where: {
      spotifyAccessToken: {
        not: null,
      },
    },
  });

  otherUsers.forEach(async (user) => {
    if (user.spotifyAccessToken) {
      getRecentlyPlayed(user.spotifyAccessToken, user.id);
    }
  });
};

onBoot();

process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed");
  });
});
