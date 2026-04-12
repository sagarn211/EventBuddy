import API from "./api";

export const getPlans = (category) => {
  const url = category && category !== "all" ? `/plans?category=${category}` : "/plans";
  return API.get(url);
};

export const getCategoryCounts = () => {
  return API.get("/plans/counts");
};

export const createPlan = (planData) => {
  return API.post("/plans", planData);
};

export const getPlanById = (id) => {
  return API.get(`/plans/${id}`);
};

export const joinPlan = (id) => {
  return API.post(`/plans/${id}/join`);
};

export const leavePlan = (id) => {
  return API.post(`/plans/${id}/leave`);
};

export const updatePlan = (id, planData) => {
  return API.put(`/plans/${id}`, planData);
};

export const deletePlan = (id) => {
  return API.delete(`/plans/${id}`);
};

export const getUserPlans = () => {
  return API.get("/plans/user/my-plans");
};

export const getNearbyPlans = (lat, lng, radius = 15000) => {
  return API.get(`/plans/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
};

export const endPlan = (id) => {
  return API.post(`/plans/${id}/end`);
};

export const savePlan = (id) => {
  return API.post(`/plans/${id}/save`);
};

export const unsavePlan = (id) => {
  return API.post(`/plans/${id}/unsave`);
};
