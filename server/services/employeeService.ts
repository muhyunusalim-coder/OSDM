import { fetchEmployeeData, fetchPromotionData, fetchMasterPegawaiData } from '../../services/dataService';

export const getEmployeeData = async (req, res) => {
  try {
    const data = await fetchEmployeeData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee data' });
  }
};

export const getPromotionData = async (req, res) => {
  try {
    const data = await fetchPromotionData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promotion data' });
  }
};

export const getMasterPegawaiData = async (req, res) => {
  try {
    const data = await fetchMasterPegawaiData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch master employee data' });
  }
};
