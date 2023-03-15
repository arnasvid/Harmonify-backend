import * as dotenv from "dotenv";
import express, { Express, Request, Response } from "express";

const app: Express = express();

dotenv.config({ path: "../.env" });

const port = process.env.PORT || 8080;
app.get("/", (req: Request, res: Response) => {
	res.send("Hello World!");
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});