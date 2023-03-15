import express, { NextFunction, Request, Response } from "express";
const router = express.Router();

/* GET home page. */
router.get('/', function(req : Request, res : Response, next : NextFunction) {
  res.render('index', { title: 'Express' });
});

export default router;
