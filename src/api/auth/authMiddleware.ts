import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../users/user.services";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer")) {
    const token = auth.slice(7);

    try {
      const tokenData = verifyToken(token);
      req.body.tokenData = tokenData;
      console.log(tokenData);
      next();
    } catch (error: any) {
      throw new Error(error.message);
    }
  } else {
    throw new Error("Invalid token");
  }
};
