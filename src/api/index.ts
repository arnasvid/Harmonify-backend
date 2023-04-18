import express, { Router } from 'express';
import auth from './auth/auth.routes';

const router: Router = express.Router();

router.use('./api/auth', auth);

export default router;
