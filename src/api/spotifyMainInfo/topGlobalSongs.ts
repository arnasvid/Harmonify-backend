import express, { Request, Response } from "express";
import axios from "axios";
import * as dotenv from "dotenv";
import { RequestAccessToken } from "../spotifyLogin/spotify.routes";

const app = express();

const BaseURL = "/api/spotifyMainInfo/";

const client_id = process.env.CLIENT_ID;

// GET request to retrieve a Spotify playli
app.get("/topGlobalSongs", async (req: Request, res: Response) => {
  const playlistId = req.params.playlistId;
  let accessToken = await RequestAccessToken();
  console.log("BRUH: ",accessToken);
  try {
    // const response = await axios.get(
    //   `https://api.spotify.com/v1/playlists/${playlistId}`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${accessToken}`
    //     },
    //   }
    // );

    const response = await fetch(
      "https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Bearer " + accessToken.access_token,
        },
      }
    ).then((response) => response.json());

    console.log("response: ",response);

    res.json(response);
  } catch (error) {
    console.error("Error retrieving playlist:", error)
    res.status(500).send("Error retrieving playlist");
  }
});

export default app;
