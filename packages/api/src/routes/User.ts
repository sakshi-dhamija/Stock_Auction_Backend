import { Router } from 'express';

const router = Router();

router.post('/signup');

router.post('/login');

router.get('/check');

export const User = router;