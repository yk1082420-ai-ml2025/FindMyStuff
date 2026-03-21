import API from './axios';

// Submit a new report (User Side)
export const createReport = async (reportData) => {
  const { data } = await API.post('/reports', reportData);
  return data.data || data;
};

// Get all reports (Admin Side)
export const getReports = async (query = '') => {
  const { data } = await API.get(`/reports${query}`);
  return data.data || data;
};

// Update report status (Admin Side)
export const updateReport = async (id, updateData) => {
  const { data } = await API.put(`/reports/${id}`, updateData);
  return data.data || data;
};
