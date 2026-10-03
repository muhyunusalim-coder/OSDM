import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getEmployeeData, getPromotionData, getMasterPegawaiData } from '../services/employeeService';

const router = express.Router();

router.get('/employees', authenticateToken, getEmployeeData);
router.get('/promotions', authenticateToken, getPromotionData);
router.get('/master', authenticateToken, getMasterPegawaiData);

export default router;
