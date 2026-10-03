import { apiClient } from '../api/client';
import { Employee } from '../types';

export const fetchEmployees = async (): Promise<Employee[]> => {
  return apiClient.get('/employees/employees');
};

export const fetchPromotions = async (): Promise<Employee[]> => {
  return apiClient.get('/employees/promotions');
};

export const fetchMasterPegawai = async (): Promise<Employee[]> => {
  return apiClient.get('/employees/master');
};
