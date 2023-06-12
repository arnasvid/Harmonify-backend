/*
  Warnings:

  - A unique constraint covering the columns `[spotifyAlbumId]` on the table `Album` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "spotifyAlbumId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Album_spotifyAlbumId_key" ON "Album"("spotifyAlbumId");
