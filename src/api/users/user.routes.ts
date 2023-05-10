import express from "express";
import { v4 as uuidv4 } from 'uuid';
import { generateTokens } from '../../utils/jwt';
import {
    addRefreshTokenToWhitelist,
} from '../auth/auth.services';
import { findUserByEmail, createUser, findUserById, findUserByToken } from './user.services';
import UserCreateRequest from "./userCreateRequest";
import { User } from '@prisma/client';
import { authMiddleware, authStatusMiddleware } from "../auth/authMiddleware";

const router = express.Router();

router.post('/register', async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        res.status(400);
        throw new Error('You must provide a username, an email and a password.');
      }
  
      const existingUser = await findUserByEmail(email);
  
      if (existingUser) {
        res.status(400);
        throw new Error('Email already in use.');
      }
  
      let user: UserCreateRequest = {
        username,
        email,
        password,
      }
  
      const createdUser = await createUser(user);
      const jti = uuidv4();
      const { accessToken, refreshToken } = generateTokens(createdUser, jti);
      await addRefreshTokenToWhitelist( jti, refreshToken, createdUser.id);
  
      res.json({
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/username', authStatusMiddleware , async (req, res, next) => {
    try {
      const tokenData = req.body.tokenData;
      const user = await findUserById(tokenData.userId);
      res.json(user?.username);
    } catch (err) {
      next(err);
    }
  });

export default router;