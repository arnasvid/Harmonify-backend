import express, { Request, Response } from "express";
import { RequestAccessToken } from "../spotifyLogin/spotify.routes";
import db from "../../utils/db";
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";
import { findUserById } from "../users/user.services";
import axios from "axios";
import cron from "node-cron";

const router = express();

const BaseURL = "/api/scrobble";

const client_id = process.env.CLIENT_ID;


cron.schedule("20 * * * *", async () => {
  console.log("running a task every 20 minutes");
  //TODO: change to 20 minutes
  //TODO: refresh access token and then get recently played

  const users = await db.user.findMany({
    where: {
      spotifyAccessToken: {
        not: null,
      },
    },
  });

  users.forEach(async (user) => {
    if (user.spotifyAccessToken) {
      const response = await getRecentlyPlayed(
        user.id,
        user.spotifyAccessToken
      );
      console.log("response: ", response);
    }
  });
});

router.get("/recently-played", authMiddleware, async (req, res) => {
  try {
    const accessToken = req.body.tokenData; // Get the accessToken after using authMiddleware
    console.log("accessToken: ", accessToken);

    const user = await findUserById(req.body.tokenData.userId);
    if (user) {
      console.log("user: ", user.username);
      const spotifyAccessToken = user.spotifyAccessToken;

      console.log(
        "alio mesk klaida, aciu spotifyAccessToken: ",
        spotifyAccessToken
      );

      if (!spotifyAccessToken)
        return res.status(404).send("No spotifyAccessToken found for the user");

      let response: RecentlyPlayedObject = await getRecentlyPlayed(
        user.id,
        spotifyAccessToken
      );

      // console.log("tracks: ", response?.items);

      res.json(response);
    } else {
      res.status(404).send("No top song found for the user");
    }
  } catch (error) {
    console.error("Error retrieving top 1 song:", error);
    res.status(500).send("Error retrieving top 1 song");
  }
});

export const getRecentlyPlayed = async (
  userId: string,
  spotifyAccessToken: string
) => {
  let res = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + spotifyAccessToken,
      },
    }
  ).then((response) => response.json());

  const newRes = res as RecentlyPlayedObject;
  let response: RecentlyPlayedObject = {
    ...newRes,
  };
  if (!response.items || response.items.length === 0) return response;
  const songs = response.items.map(
    async (item) => await checkIfSongExists(item.track)
  );

  const createdSongs = await Promise.all(songs);

  const userLastListenedSong = await db.songScrobble.findFirst({
    where: {
      userId: userId,
    },
    orderBy: {
      listenedAt: "desc",
    },
    include: {
      song: true,
    },
  });

  // xz kas cia vyksta
  if (userLastListenedSong) {
    const lastRecordedSong = response.items.find(
      (item) =>
        item.track.id === userLastListenedSong.song.spotifySongId &&
        item.played_at === userLastListenedSong.listenedAt.toISOString()
    );

    if (lastRecordedSong) {
      const lastRecordedSongIndex = response.items.indexOf(lastRecordedSong);

      if (lastRecordedSongIndex && lastRecordedSongIndex > 0) {
        const newScrobbles = response.items.slice(0, lastRecordedSongIndex);

        const newScrobbleEntities = newScrobbles.map(async (item) => {
          const song = await db.song.findFirst({
            where: {
              spotifySongId: item.track.id,
            },
          });

          if (song) {
            let scrobble = await db.songScrobble.create({
              data: {
                userId: userId,
                songId: song.id,
                listenedAt: new Date(item.played_at),
              },
            });
            return scrobble;
          }
        });

        await Promise.all(newScrobbleEntities);
      }
    }

    // console.log("createdSongs: ", createdSongs);
    return response;
  }
  const newScrobbleEntities = response.items.map(async (item) => {
    const song = await db.song.findFirst({
      where: {
        spotifySongId: item.track.id,
      },
    });

    if (!song) return;
    let scrobble = await db.songScrobble.create({
      data: {
        userId: userId,
        songId: song.id,
        listenedAt: new Date(item.played_at),
      },
    });
  });

  await Promise.all(newScrobbleEntities);

  // console.log("createdSongs: ", createdSongs);
  return response;
};

const checkIfSongExists = async (newSong: TrackObject) => {
  const song = await db.song.findFirst({
    where: {
      spotifySongId: newSong.id,
    },
  });

  if (!song) {
    const createdSong = await db.song.create({
      data: {
        spotifySongId: newSong.id,
        title: newSong.name,
        releaseDate: new Date(newSong.album.release_date),
        duration: newSong.duration_ms,
        artist: newSong.artists[0].name,
        Artist: {
          connectOrCreate: {
            where: {
              spotifyArtistId: newSong.artists[0].id,
            },
            create: {
              spotifyArtistId: newSong.artists[0].id,
              name: newSong.artists[0].name,
            },
          },
        },
        Album: {
          connectOrCreate: {
            where: {
              spotifyAlbumId: newSong.album.id,
            },
            create: {
              spotifyAlbumId: newSong.album.id,
              title: newSong.album.name,
              releaseDate: new Date(newSong.album.release_date),
              image: newSong.album.images[0].url,
              artist: newSong.artists[0].name,
              total_tracks: 1,
              Artist: {
                connectOrCreate: {
                  where: {
                    spotifyArtistId: newSong.artists[0].id,
                  },
                  create: {
                    spotifyArtistId: newSong.artists[0].id,
                    name: newSong.artists[0].name,
                  },
                },
              },
            },
          },
        },
      },
    });

    return createdSong;
  }

  return song;
};

export default router;

export interface RecentlyPlayedObject {
  href: string;
  items: PlayHistoryObject[];
  limit: number;
  next: string;
  cursors: CursorObject;
  total: number;
}

export interface PlayHistoryObject {
  track: TrackObject;
  played_at: string;
  context: ContextObject;
}

export interface TrackObject {
  album: SimplifiedAlbumObject;
  artists: SimplifiedArtistObject[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: ExternalIdObject;
  external_urls: ExternalUrlObject;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: "track";
  uri: string;
}

export interface SimplifiedAlbumObject {
  album_type: string;
  artists: SimplifiedArtistObject[];
  available_markets: string[];
  external_urls: ExternalUrlObject;
  href: string;
  id: string;
  images: ImageObject[];
  name: string;
  release_date: string;
  release_date_precision: string;
  restrictions: RestrictionsObject;
  type: "album";

  uri: string;
}

export interface SimplifiedArtistObject {
  external_urls: ExternalUrlObject;
  href: string;
  id: string;

  name: string;
  type: "artist";
  uri: string;
}

export interface ExternalUrlObject {
  spotify: string;
}

export interface ImageObject {
  url: string;
  height: number;
  width: number;
}

export interface RestrictionsObject {
  reason: string;
}

export interface ExternalIdObject {
  isrc: string;
}

export interface ContextObject {
  external_urls: ExternalUrlObject;
  href: string;
  type: "artist" | "playlist" | "album";
  uri: string;
}

export interface CursorObject {
  after: string;
}

export interface CursorPagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string;
  cursors: CursorObject;
  total: number;
}

export interface PagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
}
