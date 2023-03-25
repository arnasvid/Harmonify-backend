import * as dotenv from "dotenv";
import express, { Express, Request, Response } from "express";

const app: Express = express();

dotenv.config({ path: "../.env" });

const port = process.env.PORT || 8080;
const cors = require("cors");

app.use(cors());

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});

app.get("/", (req: Request, res: Response) => {
	res.send({ message: "We did it!" });
});