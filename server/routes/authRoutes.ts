import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/login', (req, res) => {
  // Simple mock login for now
  const { nip } = req.body;
  if (!nip) return res.status(400).send('NIP required');
  
  const token = 'mock-jwt-token'; // In production, use jwt.sign
  res.json({ token });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

export default router;
