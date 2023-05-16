import express, { Request, Response } from "express";
import request from "request-promise-native";
import * as dotenv from "dotenv";
import e from "cors";

const app = express();

// Replace these with your own credentials from the Spotify Developer Dashboard
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// Generate a random string for the state
function generateRandomString(length: number): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    randomString += possible.charAt(
      Math.floor(Math.random() * possible.length)
    );
  }

  return randomString;
}

// User login to Spotify
app.get("/login", (req: Request, res: Response) => {
  const state = generateRandomString(16);
  const scope = "user-read-private user-read-email"; // Add additional scopes as required

  // Create the authorization URL
  const authURL =
    "https://accounts.spotify.com/authorize" +
    "?response_type=code" +
    "&client_id=" +
    encodeURIComponent(client_id || "undefined") +
    (scope ? "&scope=" + encodeURIComponent(scope) : "") +
    "&redirect_uri=" +
    encodeURIComponent("http://localhost:5173/api/spotifylogin/callback") +
    "&state=" +
    encodeURIComponent(state);

  res.redirect(authURL);
});

// Handle the callback from Spotify after user authentication
app.get("/callback", async (req: Request, res: Response) => {
  const code = req.query.code;
  const state = req.query.state;
  let needToRedirectBack = true;

  // Exchange the authorization code for an access token and refresh token
  const tokenOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri,
    },
    // headers: {

    //   Authorization:
    //     "Basic " +
    //     Buffer.from(client_id + ":" + client_secret).toString("base64"),
    // },
    json: true,
  };

  try {
    // const tokenResponse = .post(tokenOptions);
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
        body:
          "grant_type=authorization_code&code=" +
          code +
          "&redirect_uri=" +
          redirect_uri,
      }
    ).then((response) => response.json());

    const access_token = tokenResponse.access_token;
    const refresh_token = tokenResponse.refresh_token;

    // Use the access_token to make API requests on behalf of the user
    // Store the refresh_token to refresh the access_token when it expires

    console.log(tokenResponse);
    console.log("meile mano parasyk true: " + needToRedirectBack);
    console.log("Access Token: " + access_token);
    // res.redirect("Login successful! Access Token: " + access_token);
    setTimeout(() => {
        res.redirect("http://localhost:5173");
    }, 4000);
    // needToRedirectBack = true;
    // res.send(needToRedirectBack);
  } catch (error) {
    console.error("Error getting tokens:", error);
    res.status(400).send("Error getting tokens");
    needToRedirectBack = false;
    res.send(needToRedirectBack);
  }
});
export default app;
