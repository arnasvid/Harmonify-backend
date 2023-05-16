import * as dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import SpotifyWebApi from "spotify-web-api-node";

const LoginSpotify = () => {
    // const spotifyApi = new SpotifyWebApi({
    //     clientId: process.env.CLIENT_ID,
    //     clientSecret: process.env.CLIENT_SECRET,
    //     redirectUri: "/",
    // });
    
    // const scopes = [
    //     "user-read-private",
    //     "user-read-email",
    //     "user-read-currently-playing",
    //     "user-read-playback-state",
    //     "user-modify-playback-state",
    //     "user-library-read",
    //     "user-library-modify",
    //     "playlist-read-private",
    //     "playlist-read-collaborative",
    //     "playlist-modify-public",
    //     "playlist-modify-private",
    // ];

    // const authorizeURL = spotifyApi.createAuthorizeURL(scopes, "state", true);
    // console.log(authorizeURL);
}

export const RequestAccessToken = async () => {
    await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",

        },
        body: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`,
    })
    .then((response) => response.json())
    .then((data) => console.log(data));
}

export const GetGlobalTop50 = async () => {

}