import express, { Request, Response } from "express";
import { RequestAccessToken } from "../spotifyLogin/spotify.routes";
import db from "../../utils/db";
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";
import { findUserById } from "../users/user.services";
import axios from "axios";
import cron from "node-cron";
import { Artist, SongScrobble } from "@prisma/client";

const router = express();

const BaseURL = "/api/scrobble";

const client_id = process.env.CLIENT_ID;

cron.schedule("5 * * * *", async () => {
  console.log("running a task every 10 minutes");
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
    }
  });
});

router.get("/weekly-activity", authMiddleware, async (req, res) => {
  try {
    const userId = req.body.tokenData.userId;
    const user = await findUserById(userId);
    if (!user) return res.status(404).send("No user found");
    const spotifyAccessToken = user.spotifyAccessToken;

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastWeekScrobbles = await db.songScrobble.findMany({
      where: {
        AND: [{ userId: userId }, { listenedAt: { gte: lastWeek } }],
      },
      include: {
        song: {
          include: {
            Artist: true,
          },
        },
      },
    });

    const lastWeekScrobbleIds = await Promise.all(
      lastWeekScrobbles.map(async (scrobble) => scrobble.song.spotifySongId)
    );

    const lastWeekScrobblesFromSpotify: any[] = [];
    // split array into chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < lastWeekScrobbleIds.length; i += chunkSize) {
      const lastWeekScrobblesFromSpotify1 = await fetch(
        `https://api.spotify.com/v1/tracks?ids=${lastWeekScrobbleIds
          .splice(0, 49)
          .join("%2C")}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${spotifyAccessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      ).then((response) => response.json());

      lastWeekScrobblesFromSpotify.push(
        ...lastWeekScrobblesFromSpotify1.tracks
      );
    }

    // calculate top 5 songs from lastWeekScrobblesFromSpotify, by counting the number of times each song appears in the array and then sorting the array by the count and returning the top 5

    // count the number of time a song appears in the array
    const topSongsMap = new Map<any, number>();
    lastWeekScrobblesFromSpotify.forEach((song: any) => {
      if (topSongsMap.has(song.id)) {
        topSongsMap.set(song.id, (topSongsMap.get(song.id) || 0) + 1);
      } else {
        topSongsMap.set(song.id, 1);
      }
    });

    // sort the map by the count
    const sortedMap = new Map(
      [...topSongsMap.entries()].sort((a, b) => b[1] - a[1])
    );

    const top5SongsIdArray = Array.from(sortedMap.keys()).slice(0, 5);

    const top5Songs = await Promise.all(
      top5SongsIdArray.map(async (songId) => {
        const response = await fetch(
          `https://api.spotify.com/v1/tracks/${songId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${spotifyAccessToken}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
        return response.json();
      })
    );

    res.json(top5Songs);

    // get the top 5 songs
    // const top5Songs = Array.from(sortedMap.keys()).slice(0, 5);

    // const top5Songs1 = lastWeekScrobblesFromSpotify.reduce((acc, curr) => {
    //   if (typeof acc[curr] == "undefined") {
    //     acc[curr] = 1;
    //   } else {
    //     acc[curr] += 1;
    //   }
    //   return acc;
    // }, {});

    // const topSongs = lastWeekScrobbles.sort(
    //   (a: any, b: any) => b.count - a.count
    // );

    // const sortedTop5Songs = Object.keys(top5Songs)
    //   .sort((a: any, b: any) => top5Songs[b] - top5Songs[a])
    //   .slice(0, 5);

    // const sorted = top5Songs.sort((a: any, b: any) => b.count - a.count);

    // console.log("sorted 5 songs", sortedTop5Songs);

    // const top5SongsWithCount = sortedTop5Songs.map((song) => {
    //   return { song: song, count: top5Songs[song] };
    // });

    // tik penkios dainos su skaiciumi grojimo
    // res.json(top5Songs);

    // visos per savaite klausytos dainos
    // res.json(lastWeekScrobblesFromSpotify);
  } catch (error) {
    console.error("Error retrieving weekly activity:", error);
    res.status(500).send("Error retrieving weekly activity");
  }
});

router.get("/top-weekly-genres", authMiddleware, async (req, res) => {
  try {
    const accessToken = req.body.tokenData; // Get the accessToken after using authMiddleware
    const userId = req.body.tokenData.userId;
    const user = await findUserById(userId);
    if (!user) return res.status(404).send("No user found");

    const spotifyAccessToken = user.spotifyAccessToken;
    if (!spotifyAccessToken)
      return res.status(404).send("No spotify access token found");

    const topArtistsFromSpotify = await getTopWeeklyArtists(
      userId,
      spotifyAccessToken
    );
    const topGenres = topArtistsFromSpotify.map((artist) => artist.genres);
    let genreMap = new Map<string, number>();

    topGenres.forEach((genres) => {
      genres.forEach((genre: any) => {
        if (genreMap.has(genre)) {
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        } else {
          genreMap.set(genre, 1);
        }
      });
    });

    const sortedMap = new Map(
      [...genreMap.entries()].sort((a, b) => b[1] - a[1])
    );

    let genreArrayWithCount: { genre: string; count: number }[] = [];

    sortedMap.forEach((value, key) => {
      genreArrayWithCount.push({ genre: key, count: value });
    });

    res.json(genreArrayWithCount);
  } catch (error) {
    console.error("Error retrieving top 1 song:", error);
    res.status(500).send("Error retrieving top 1 song");
  }
});

router.get("/top-weekly-artists", authMiddleware, async (req, res) => {
  try {
    const accessToken = req.body.tokenData; // Get the accessToken after using authMiddleware
    const userId = req.body.tokenData.userId;
    const user = await findUserById(userId);
    if (!user) return res.status(404).send("No user found");

    const spotifyAccessToken = user.spotifyAccessToken;
    if (!spotifyAccessToken)
      return res.status(404).send("No spotify access token found");

    const topArtistsFromSpotify = await getTopWeeklyArtists(
      userId,
      spotifyAccessToken
    );
    res.json(topArtistsFromSpotify);
  } catch (error) {
    console.error("Error retrieving top 1 song:", error);
    res.status(500).send("Error retrieving top 1 song");
  }
});

const getTopWeeklyArtists = async (userId: string, accessToken: string) => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const lastWeekScrobbles = await db.songScrobble.findMany({
    where: {
      AND: [{ userId: userId }, { listenedAt: { gte: lastWeek } }],
    },
    include: {
      song: {
        include: {
          Artist: true,
        },
      },
    },
  });

  const artists = lastWeekScrobbles.map((scrobble) => scrobble.song.Artist);
  let artistMap = new Map<string, number>();

  artists.forEach((artist) => {
    if (artist) {
      if (artistMap.has(artist.id)) {
        artistMap.set(artist.id, (artistMap.get(artist.id) || 0) + 1);
      } else {
        artistMap.set(artist.id, 1);
      }
    }
  });

  const sortedMap = new Map(
    [...artistMap.entries()].sort((a, b) => b[1] - a[1])
  );

  console.log("sortedMap: ", sortedMap);

  const topArtistIds = Array.from(sortedMap.keys()).slice(0, 5);

  const topArtists: Artist[] = await db.artist.findMany({
    where: {
      id: {
        in: topArtistIds,
      },
    },
  });

  const topArtistsFromSpotify = await Promise.all(
    topArtists.map(async (artist) => {
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artist.spotifyArtistId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.json();
    })
  );
  console.log("topArtistsFromSpotify: ", topArtistsFromSpotify);
  return topArtistsFromSpotify;
};

router.get("/recently-played", authMiddleware, async (req, res) => {
  try {
    const accessToken = req.body.tokenData; // Get the accessToken after using authMiddleware

    const user = await findUserById(req.body.tokenData.userId);
    if (user) {
      console.log("user: ", user.username);
      const spotifyAccessToken = user.spotifyAccessToken;

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

  console.log("userLastListenedSong: ", userLastListenedSong);
  // xz kas cia vyksta
  if (userLastListenedSong) {
    console.log(
      "response.items: ",
      response.items.sort((a: any, b: any) => a.played_at - b.played_at)[0]
    );
    const lastRecordedSong = response.items.find(
      (item) =>
        item.track.id === userLastListenedSong.song.spotifySongId &&
        item.played_at === userLastListenedSong.listenedAt.toISOString()
    );

    console.log("lastRecordedSong: ", lastRecordedSong);
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
    } else {
      const newScrobbleEntities = response.items.map(async (item) => {
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
