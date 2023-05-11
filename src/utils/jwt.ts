import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const jwtAccessToken = process.env.JWT_ACCESS_SECRET;

const generateAccessToken = (user : User) => {
  if (!jwtAccessToken) {
    throw new Error('JWT_ACCESS_SECRET not defined');
  }
  return jwt.sign({userId: user.id}, jwtAccessToken, { expiresIn: '24h' });
}

const generateRefreshToken = (user: User, jti: string): string => {
  return jwt.sign({
    userId: user.id,
    jti
  }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '24h',
  });
}

const generateTokens = (user: User, jti: string): { accessToken: string, refreshToken: string } => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user, jti);

  return {
    accessToken,
    refreshToken,
  };
}

export {
  generateAccessToken,
  generateRefreshToken,
  generateTokens
};