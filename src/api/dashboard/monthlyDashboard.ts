import express, { Request, Response } from "express";
import { RequestAccessToken } from "../spotifyLogin/spotify.routes";
import db from "../../utils/db";
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";
import { findUserById } from "../users/user.services";

const router = express();

const BaseURL = "/api/dashboard";

const client_id = process.env.CLIENT_ID;

router.get("/monthlyArtists", authMiddleware, async (req, res) => {
    try {
        const accessToken = req.body.tokenData;
        const user = await findUserById(req.body.tokenData.userId);
        if (user) {
            const spotifyAccessToken = user.spotifyAccessToken;
            
            const response = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5&offset=0", {
                method: "GET",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Bearer " + spotifyAccessToken,
                },
            }).then((response) => response.json());
            res.json(response);
        } else {
            res.status(404).send("No top monthly artists found for the user");
        }
    } catch (error) {
        console.error("Error retrieving top monthly artists:", error);
        res.status(500).send("Error retrieving top monthly artists");
    }
});

router.get("/monthlySongs", authMiddleware, async (req, res) => {
    try {
        const accessToken = req.body.tokenData;
        const user = await findUserById(req.body.tokenData.userId);
        if (user) {
            const spotifyAccessToken = user.spotifyAccessToken;

            const response = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5&offset=0", {
                method: "GET",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Bearer " + spotifyAccessToken,
                },
            }).then((response) => response.json());
            res.json(response);
        } else {
            res.status(404).send("No top monthly songs found for the user");
        }
    } catch (error) {
        console.error("Error retrieving top monthly songs:", error);
        res.status(500).send("Error retrieving top monthly songs");
    }
});

export default router;