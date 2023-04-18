import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateTokens } from '../../utils/jwt';
import {
  addRefreshTokenToWhitelist,
} from './auth.services';
import { findUserByEmail, createUser } from '../users/user.services';
import { User } from '@prisma/client';
import UserCreateRequest from '../users/userCreateRequest';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error('You must provide an username, email and a password.');
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

export default router;
