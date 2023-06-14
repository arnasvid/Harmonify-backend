import express, { Request, Response } from "express";
import { RequestAccessToken } from "../spotifyLogin/spotify.routes";
import db from "../../utils/db";
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";
import { findUserById } from "../users/user.services";


const app = express();

const BaseURL = "/api/dashboard";

const client_id = process.env.CLIENT_ID;

app.get('/monthly-genres', authMiddleware, async (req: Request, res: Response) => {
    try {
      const accessToken = req.body.tokenData;
      const user = await findUserById(req.body.tokenData.userId);
  
      if (user) {
        const spotifyAccessToken = user.spotifyAccessToken;
  
        const response = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50&offset=0', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Bearer ' + spotifyAccessToken,
          },
        }).then((response) => response.json());
  
        // Calculate genre counts
        const genreCounts: { [key: string]: number } = {};
  
        response.items.forEach((artist: any) => {
          if (artist.genres && artist.genres.length > 0) {
            artist.genres.forEach((genre: string) => {
              if (genreCounts.hasOwnProperty(genre)) {
                genreCounts[genre]++;
              } else {
                genreCounts[genre] = 1;
              }
            });
          }
        });
  
        const genresWithCounts = Object.keys(genreCounts).map((genre) => ({
          genre,
          count: genreCounts[genre],
        }));
  
        res.json(genresWithCounts)
      } else {
        res.status(404).send('No top monthly artists found for the user');
      }
    } catch (error) {
      console.error('Error retrieving top monthly artists:', error);
      res.status(500).send('Error retrieving top monthly artists');
    }
  });

  app.get('/halfYear-genres', authMiddleware, async (req: Request, res: Response) => {
    try {
      const accessToken = req.body.tokenData;
      const user = await findUserById(req.body.tokenData.userId);
  
      if (user) {
        const spotifyAccessToken = user.spotifyAccessToken;
  
        const response = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50&offset=0', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Bearer ' + spotifyAccessToken,
          },
        }).then((response) => response.json());
  
        const genreCounts: { [key: string]: number } = {};
  
        response.items.forEach((artist: any) => {
          if (artist.genres && artist.genres.length > 0) {
            artist.genres.forEach((genre: string) => {
              if (genreCounts.hasOwnProperty(genre)) {
                genreCounts[genre]++;
              } else {
                genreCounts[genre] = 1;
              }
            });
          }
        });
  
        // Create JSON response with genre counts
        const genresWithCounts = Object.keys(genreCounts).map((genre) => ({
          genre,
          count: genreCounts[genre],
        }));
  
        res.json(genresWithCounts)
      } else {
        res.status(404).send('No top monthly artists found for the user');
      }
    } catch (error) {
      console.error('Error retrieving top monthly artists:', error);
      res.status(500).send('Error retrieving top monthly artists');
    }
  });

  app.get('/allTime-genres', authMiddleware, async (req: Request, res: Response) => {
    try {
      const accessToken = req.body.tokenData;
      const user = await findUserById(req.body.tokenData.userId);
  
      if (user) {
        const spotifyAccessToken = user.spotifyAccessToken;
  
        const response = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=50&offset=0', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Bearer ' + spotifyAccessToken,
          },
        }).then((response) => response.json());
  
        // Calculate genre counts
        const genreCounts: { [key: string]: number } = {};
  
        response.items.forEach((artist: any) => {
          if (artist.genres && artist.genres.length > 0) {
            artist.genres.forEach((genre: string) => {
              if (genreCounts.hasOwnProperty(genre)) {
                genreCounts[genre]++;
              } else {
                genreCounts[genre] = 1;
              }
            });
          }
        });
  
        const genresWithCounts = Object.keys(genreCounts).map((genre) => ({
          genre,
          count: genreCounts[genre],
        }));
  
        res.json(genresWithCounts)
      } else {
        res.status(404).send('No top monthly artists found for the user');
      }
    } catch (error) {
      console.error('Error retrieving top monthly artists:', error);
      res.status(500).send('Error retrieving top monthly artists');
    }
  });

export default app;