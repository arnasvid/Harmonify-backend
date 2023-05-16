-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[],
ADD COLUMN     "spotifyRefreshToken" TEXT;

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "total_tracks" INTEGER NOT NULL,
    "image" TEXT,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "artistId" TEXT,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongScrobble" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "listenedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SongScrobble_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "spotifySongId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "playlistId" TEXT,
    "albumId" TEXT,
    "artistId" TEXT,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopSong50" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopSong50_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewReleases" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewReleases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteSong" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteSong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongsWeListen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SongsWeListen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTopArtist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTopArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToArtist" (
    "userTopArtistId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserTopSongs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserTopSongs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToSong" (
    "userTopSongsId" TEXT,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserTopAlbums" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserTopAlbums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToAlbum" (
    "userTopAlbumsId" TEXT,
    "userId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_id_key" ON "Playlist"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Album_id_key" ON "Album"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SongScrobble_id_key" ON "SongScrobble"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Song_id_key" ON "Song"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Song_spotifySongId_key" ON "Song"("spotifySongId");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_id_key" ON "Artist"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TopSong50_id_key" ON "TopSong50"("id");

-- CreateIndex
CREATE UNIQUE INDEX "NewReleases_id_key" ON "NewReleases"("id");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteSong_id_key" ON "FavoriteSong"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SongsWeListen_id_key" ON "SongsWeListen"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserTopArtist_id_key" ON "UserTopArtist"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserToArtist_userId_artistId_key" ON "UserToArtist"("userId", "artistId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTopSongs_id_key" ON "UserTopSongs"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserToSong_userId_songId_key" ON "UserToSong"("userId", "songId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTopAlbums_id_key" ON "UserTopAlbums"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserToAlbum_userId_albumId_key" ON "UserToAlbum"("userId", "albumId");

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongScrobble" ADD CONSTRAINT "SongScrobble_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongScrobble" ADD CONSTRAINT "SongScrobble_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopSong50" ADD CONSTRAINT "TopSong50_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopSong50" ADD CONSTRAINT "TopSong50_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewReleases" ADD CONSTRAINT "NewReleases_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewReleases" ADD CONSTRAINT "NewReleases_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteSong" ADD CONSTRAINT "FavoriteSong_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteSong" ADD CONSTRAINT "FavoriteSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteSong" ADD CONSTRAINT "FavoriteSong_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongsWeListen" ADD CONSTRAINT "SongsWeListen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongsWeListen" ADD CONSTRAINT "SongsWeListen_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongsWeListen" ADD CONSTRAINT "SongsWeListen_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopArtist" ADD CONSTRAINT "UserTopArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToArtist" ADD CONSTRAINT "UserToArtist_userTopArtistId_fkey" FOREIGN KEY ("userTopArtistId") REFERENCES "UserTopArtist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToArtist" ADD CONSTRAINT "UserToArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToArtist" ADD CONSTRAINT "UserToArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopSongs" ADD CONSTRAINT "UserTopSongs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToSong" ADD CONSTRAINT "UserToSong_userTopSongsId_fkey" FOREIGN KEY ("userTopSongsId") REFERENCES "UserTopSongs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToSong" ADD CONSTRAINT "UserToSong_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToSong" ADD CONSTRAINT "UserToSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopAlbums" ADD CONSTRAINT "UserTopAlbums_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToAlbum" ADD CONSTRAINT "UserToAlbum_userTopAlbumsId_fkey" FOREIGN KEY ("userTopAlbumsId") REFERENCES "UserTopAlbums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToAlbum" ADD CONSTRAINT "UserToAlbum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToAlbum" ADD CONSTRAINT "UserToAlbum_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
