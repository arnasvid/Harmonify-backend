import db from '../../utils/db';
import { hashToken } from '../../utils/hashToken';

const addRefreshTokenToWhitelist = (jti : string, refreshToken : string, userId : string) => {
  return db.refreshToken.create({
    data: {
      id: jti,
      hashedToken: hashToken(refreshToken),
      userId
    },
  });
}

const findRefreshTokenById = (id : string) => {
  return db.refreshToken.findUnique({
    where: {
      id,
    },
  });
}

const deleteRefreshToken = (id : string) => {
  return db.refreshToken.update({
    where: {
      id,
    },
    data: {
      revoked: true
    }
  });
}

const revokeTokens = (userId : string) => {
  return db.refreshToken.updateMany({
    where: {
      userId
    },
    data: {
      revoked: true
    }
  });
}

export {
  addRefreshTokenToWhitelist,
  findRefreshTokenById,
  deleteRefreshToken,
  revokeTokens
};