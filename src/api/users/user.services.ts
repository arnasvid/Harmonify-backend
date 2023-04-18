import bcrypt from 'bcrypt';
import db from '../../utils/db';
import { User } from '@prisma/client';
import UserCreateRequest from './userCreateRequest';

const findUserByEmail = (email: string) => {
  return db.user.findUnique({
    where: {
      email,
    },
  });
}

const createUser = (user : UserCreateRequest) => {
  user.password = bcrypt.hashSync(user.password, 12);
  return db.user.create({
    data: user,
  });
}

const findUserById = (id: string) => {
  return db.user.findUnique({
    where: {
      id : id
    },
  });
}

export {
  findUserByEmail,
  findUserById,
  createUser
};
