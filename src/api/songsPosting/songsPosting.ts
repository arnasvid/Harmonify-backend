import express, { Request, Response } from "express";
import db from "../../utils/db";
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";
import { findUserById } from "../users/user.services";

const router = express();

router.use(express.json());

const BaseURL = "/api/songsPosting/";

// Then, we need to modify the existing postSong route
router.post(`/postSong`, authStatusMiddleware, async (req: Request, res: Response) => {
      try {
        // Extract required data from the request
        const {
          token,
          songName,
          artistName,
          albumName,
          albumImageURL,
          description,
        } = req.body;

        console.log("req.body: ",req.body);

        const user = await findUserById(req.body.tokenData.userId);

        if (!user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }

        // Create a new song entry in the Song table
        const newSong = await db.song.create({
          data: {
            title: songName,
            spotifySongId: Math.floor(Math.random() * 100000).toString(),
            artist: artistName,
            releaseDate: new Date(),
            duration: 0,
          },
        });

        // Create a new artist entry in the Artist table
        const newArtist = await db.artist.create({
          data: {
            name: artistName,
            songs: {
              connect: {
                id: newSong.id,
              },
            },
          },
        });

        const newAlbum = await db.album.create({
          data: {
            title: albumName,
            artist: artistName,
            total_tracks: 10,
            image: albumImageURL,
            releaseDate: new Date(),
            songs: {
              connect: {
                id: newSong.id,
              },
            },
            artistId: newArtist.id,
          },
        });

        const newSongsWeListen = await db.songsWeListen.create({
          data: {
            userId: user.id,
            songId: newSong.id,
            artistId: newArtist.id,
            albumId: newAlbum.id,
            description,
          },
        });

        res
          .status(200)
          .json({ message: "Song posted successfully.", newSongsWeListen });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to post the song." });
      }
    });

router.get(`/getPostSongs`, authStatusMiddleware, async (req: Request, res: Response) => {
    try{
        const data = await db.songsWeListen.findMany({
            include: {
                song: true,
                artist: true,
                album: true,
                user: true,
            },
        });
        res.status(200).json({ message: "Songs retrieved successfully.", data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get the songs." });
    }
});

router.put(`/updatePostSong/:id`, authStatusMiddleware, async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const { description } = req.body;
        const data = await db.songsWeListen.update({
            where: {
                id: id,
            },
            data: {
                description: description,
            },
        });
        res.status(200).json({ message: "Songs updated successfully.", data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update the songs." });
    }
});

router.delete(`/deletePostSong/:id`, authStatusMiddleware, async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const data = await db.songsWeListen.delete({
            where: {
                id: id,
            },
        });
        res.status(200).json({ message: "Songs deleted successfully.", data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete the songs." });
    }
});

export default router;
