import express, { Request, Response } from "express";
import { RequestAccessToken } from "../spotifyLogin/spotify.routes";
import db from "../../utils/db";
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";
import { findUserById } from "../users/user.services";

const router = express();

const BaseURL = "/api/dashboard";

const client_id = process.env.CLIENT_ID;

router.get("/halfYearArtists", authMiddleware, async (req, res) => {
    try {
        const accessToken = req.body.tokenData;
        const user = await findUserById(req.body.tokenData.userId);
        if (user) {
            const spotifyAccessToken = user.spotifyAccessToken;

            const response = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5&offset=0", {
                method: "GET",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Bearer " + spotifyAccessToken,
                },
            }).then((response) => response.json());
            res.json(response)
        } else {
            res.status(404).send("No top half-year artists found for the user");
        }
    } catch (error) {
        console.error("Error retrieving top half-year artists:", error);
        res.status(500).send("Error retrieving top half-year artists");
    }
});

router.get("/halfYearSongs", authMiddleware, async (req, res) => {
    try {
        const accessToken = req.body.tokenData;
        const user = await findUserById(req.body.tokenData.userId);
        if (user) {
            const spotifyAccessToken = user.spotifyAccessToken

            const response = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=5&offset=0", {
                method: "GET",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Bearer " + spotifyAccessToken,
                },
            }).then((response) => response.json());
            res.json(response);
        } else {
            res.status(404).send("No top half-year songs found for the user");
        }
    } catch (error) {
        console.error("Error retrieving top half-year songs:", error);
        res.status(500).send("Error retrieving top half-year songs");
    }
});

export default router;