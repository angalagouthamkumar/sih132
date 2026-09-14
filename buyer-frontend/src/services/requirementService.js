import api from './api';

export const createRequirement = async (requirementData) => {
  const response = await api.post('/requirements', requirementData);
  return response.data;
};

export const getMyRequirements = async () => {
  const response = await api.get('/requirements/mine');
  return response.data;
};

export const updateRequirement = async (id, updateData) => {
  const response = await api.patch(`/requirements/${id}`, updateData);
  return response.data;
};

export const deleteRequirement = async (id) => {
  const response = await api.delete(`/requirements/${id}`);
  return response.data;
};
