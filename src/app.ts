import * as dotenv from "dotenv";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import auth from "./api/auth/auth.routes";
import { debug } from "console";
import { authStatusMiddleware } from "./api/auth/authMiddleware";
import users from "./api/users/user.routes";
import SpotifyWebApi from 'spotify-web-api-node';
import { RequestAccessToken } from "./api/spotify_general/spotify.routes";
import spotifylogin from "./api/spotify_general/spotifylogin";

const app: Express = express();

dotenv.config({ path: ".env" });

const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/spotifylogin", spotifylogin);

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "We did it!" });
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

RequestAccessToken();

process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed");
  });
});
