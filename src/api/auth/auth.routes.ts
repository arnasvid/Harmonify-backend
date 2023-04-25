import express from "express";
import { v4 as uuidv4 } from "uuid";
import { generateTokens } from "../../utils/jwt";
import dotenv from "dotenv";
import {
  addRefreshTokenToWhitelist,
  findRefreshTokenById,
  deleteRefreshToken,
  revokeTokens,
} from "./auth.services";
import {
  findUserByEmail,
  findUserByUsername,
  createUser,
  findUserById,
} from "../users/user.services";
import UserCreateRequest from "../users/userCreateRequest";
import bcrypt from "bcrypt";
import { hashToken } from "../../utils/hashToken";
import jwt from "jsonwebtoken";
import { authMiddleware, authStatusMiddleware } from "./authMiddleware";

dotenv.config();
const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error("You must provide an username, email and a password.");
    }

    const existingUserEmail = await findUserByEmail(email);
    const existingUserUsername = await findUserByUsername(username);

    if (existingUserEmail) {
      res.status(400);
      throw new Error("Email already in use.");
    }

    if (existingUserUsername) {
      res.status(400);
      throw new Error("Username already in use.");
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

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("You must provide an email and a password.");
    }
    const existingUser = await findUserByEmail(email);

    if (!existingUser) {
      res.status(403);
      throw new Error("Invalid login credentials.");
    }

    const validPassword = await bcrypt.compare(password, existingUser.password);

    if (!validPassword) {
      res.status(403);
      throw new Error("Invalid login credentials.");
    }

    const jti = uuidv4();
    const { accessToken, refreshToken } = generateTokens(existingUser, jti);
    await addRefreshTokenToWhitelist(jti, refreshToken, existingUser.id);

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refreshToken", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400);
      throw new Error("Missing refresh token.");
    }
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { jti: string; userId: string };
    const savedRefreshToken = await findRefreshTokenById(payload.jti);

    if (!savedRefreshToken || savedRefreshToken.revoked === true) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    const hashedToken = hashToken(refreshToken);
    if (hashedToken !== savedRefreshToken.hashedToken) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    const user = await findUserById(payload.userId);
    if (!user) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    await deleteRefreshToken(savedRefreshToken.id);
    const jti = uuidv4();
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user,
      jti
    );
    await addRefreshTokenToWhitelist(jti, newRefreshToken, user.id);

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/revokeRefreshTokens", async (req, res, next) => {
  try {
    const { userId } = req.body;
    await revokeTokens(userId);
    res.json({ message: `Tokens revoked for user with id #${userId}` });
  } catch (err) {
    next(err);
  }
});

router.get("/status", authStatusMiddleware, async (req, res, next) => {
  try {
    console.log("status called");
    // // data from the token that is verified
    const tokenData = req.body.tokenData;
    if (tokenData) {
      res.send({ isUserLoggedIn: true });
    } else {
      res.send({ isUserLoggedIn: false });
    }
    console.log("tokenData", tokenData);
  } catch (err) {
    res.send({ isUserLoggedIn: false });
    next(err);
  }
});

export default router;
