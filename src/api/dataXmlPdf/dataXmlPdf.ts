import express from 'express';
import db from '../../utils/db';

const app = express();
const BaseUrl = '/api/dataXmlPdf/';

app.get('/dataJson', async (req, res) => {
  try {
    const albums = await db.album.findMany({
      include: { songs: true, Artist: true },
    });
    const songs = await db.song.findMany({
      include: { Album: true, Artist: true},
    });
    const artists = await db.artist.findMany({
      include: { songs: true, albums: true },
    });

    const data = {
      albums,
      songs,
      artists,
    };
    console.log(data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('An error occurred while fetching data');
  }
});

app.get('/dataPdf', async (req, res) => {
  try {
    const users = await db.user.findMany();
    const data = users;

    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('An error occurred while fetching data');
  }
});

export default app;
