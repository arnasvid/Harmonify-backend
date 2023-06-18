import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../utils/db";
import UserCreateRequest from "./userCreateRequest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const findUserByEmail = (email: string) => {
  return db.user.findUnique({
    where: {
      email,
    },
  });
};

const findUserByUsername = (username: string) => {
  return db.user.findUnique({
    where: {
      username,
    },
  });
};

const createUser = (user: UserCreateRequest) => {
  user.password = bcrypt.hashSync(user.password, 12);
  return db.user.create({
    data: user,
  });
};

const findUserById = (id: string) => {
  return db.user.findUnique({
    where: {
      id: id,
    },
  });
};

const verifyToken = (token: string): { _id: string; email: string } => {
  try {
    const jwtKey = process.env.JWT_ACCESS_SECRET as string;
    const tokenData = jwt.verify(token, jwtKey);
    return tokenData as { _id: string; email: string };
  } catch (error) {
    throw new Error("Invalid token");
  }
};

const findUserByToken = (token: string) => {
  const tokenData = verifyToken(token);
  return db.user.findUnique({
    where: {
      id: tokenData._id,
    },
  });
};

const updateUserSpotifyTokens = async (
  id: string,
  accessToken: string,
  refreshToken: string
) => {
  return await db.user.update({
    where: { id },
    data: {
      spotifyAccessToken: accessToken,
      spotifyRefreshToken: refreshToken,
    },
  });
};

const imageBuffer = (filePath: string) => {
  try {
    if (existsSync(join(process.cwd(), `${filePath}`))) {
      return readFileSync(join(process.cwd(), `${filePath}`));
    }
    throw new Error("File not found");
  } catch (err) {
    throw new Error("File not found");
  }
};

export {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  verifyToken,
  findUserByToken,
  updateUserSpotifyTokens,
  imageBuffer
};
