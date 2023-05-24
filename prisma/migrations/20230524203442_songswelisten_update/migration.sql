/*
  Warnings:

  - Added the required column `artistId` to the `SongsWeListen` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SongsWeListen" ADD COLUMN     "artistId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SongsWeListen" ADD CONSTRAINT "SongsWeListen_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
