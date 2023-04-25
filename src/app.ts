import * as dotenv from "dotenv";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import auth from "./api/auth/auth.routes";
import { debug } from "console";

const app: Express = express();

dotenv.config({ path: ".env" });

const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.use("/api/auth", auth);

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "We did it!" });
});
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed");
  });
});