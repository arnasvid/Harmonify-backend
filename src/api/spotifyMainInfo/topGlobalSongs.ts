import express, { Request, Response } from "express";
import axios from "axios";
import * as dotenv from "dotenv";
import { RequestAccessToken } from "../spotifyLogin/spotify.routes";
import db from "../../utils/db";
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";
import { findUserById } from "../users/user.services";

const app = express();

const BaseURL = "/api/spotifyMainInfo/";

const client_id = process.env.CLIENT_ID;

// GET request to retrieve a Spotify playli
app.get("/topGlobalSongs", async (req: Request, res: Response) => {
  const playlistId = req.params.playlistId;
  let accessToken = await RequestAccessToken();
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
    res.status(500).send("Error retrieving playlist")
  }
});

app.get("/new-releases", async (req: Request, res: Response) => {
  let accessToken = await RequestAccessToken();
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/browse/new-releases?limit=50&offset=0",
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
    console.error("Error retrieving new releases:", error)
    res.status(500).send("Error retrieving new releases");
  }
});
    
// Get the top 1 song of a user
app.get("/user/top-1-song", authMiddleware, async (req, res) => {
  try {
    const accessToken = req.body.tokenData; // Get the accessToken after using authMiddleware
    console.log("accessToken: ", accessToken);

    const user = await findUserById(req.body.tokenData.userId)
    if (user) {
      console.log("user: ", user.username);
      const spotifyAccessToken = user.spotifyAccessToken;

      console.log("sito userio blechaspotifyAccessToken: ", spotifyAccessToken);
      const response = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=1", {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Bearer " + spotifyAccessToken,
        },
      }).then((response) => response.json());
      
      // console.log("response: ", response);
      
      res.json(response);
    } else {
      res.status(404).send("No top song found for the user");
    }
  } catch (error) {
    console.error("Error retrieving top 1 song:", error);
    res.status(500).send("Error retrieving top 1 song");
  }
});


export default app;
