import express from "express";
import { v4 as uuidv4 } from "uuid";
import { generateTokens } from "../../utils/jwt";
import { addRefreshTokenToWhitelist } from "../auth/auth.services";
import {
  findUserByEmail,
  createUser,
  findUserById,
  findUserByToken,
  imageBuffer,
} from "./user.services";
import UserCreateRequest from "./userCreateRequest";
import { User } from "@prisma/client";
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";
import multer, { diskStorage } from "multer";
import db from "../../utils/db";
const regExp = /(?:\.([^.]+))?$/;

export const storage = diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const filename: string = file.originalname;
    const regExpExecArray = regExp.exec(filename);
    const extension = regExpExecArray ? regExpExecArray[1] : undefined;
    const randomName = uuidv4();
    cb(null, `${randomName}.${extension}`);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400);
      throw new Error("You must provide a username, an email, and a password.");
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      res.status(400);
      throw new Error("Email already in use.");
    }

    let user: UserCreateRequest = {
      username,
      email,
      password,
    };

    const createdUser = await createUser(user);
    const jti = uuidv4();
    const { accessToken, refreshToken } = generateTokens(createdUser, jti);
    await addRefreshTokenToWhitelist(jti, refreshToken, createdUser.id);

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/username", authStatusMiddleware, async (req, res, next) => {
  try {
    const tokenData = req.body.tokenData;
    const user = await findUserById(tokenData.userId);
    res.json(user?.username);
  } catch (err) {
    next(err);
  }
});

router.get("/id", authStatusMiddleware, async (req, res, next) => {
  try {
    const tokenData = req.body.tokenData;
    const user = await findUserById(tokenData.userId);
    res.json(user?.id);
  } catch (err) {
    next(err);
  }
});

router.get("/getProfilePicture", authMiddleware, async (req, res, next) => {
  try {
    const tokenData = req.body.tokenData;
    const user = await findUserById(tokenData.userId);
    if (user?.profilePicture) {
      let buffer = imageBuffer(user?.profilePicture);
      res.contentType("png").send(buffer);
    }
    res.status(400);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/uploadProfilePicture",
  upload.single("profilePicture"),
  authMiddleware,
  async (req, res, next) => {
    try {
      const tokenData = req.body.tokenData;
      console.log(tokenData);
      const user = await findUserById(tokenData.userId);
      if (!user) {
        res.status(400);
        throw new Error("User not found");
      }

      const profilePicture = req.file;
      if (profilePicture) {
        console.log(profilePicture);
        const filename: string = profilePicture.filename;

        const imagePath = `/uploads/${filename}`;

        const updatedUser = await db.user.update({
          where: {
            id: user.id,
          },
          data: {
            profilePicture: imagePath,
          },
        });

        res.json({ imagePath });
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);

export default router;
