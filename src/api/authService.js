import API from "./api";

export const sendOtp = (phone) => {
  return API.post("/auth/send-otp", { phone });
};

export const verifyOtp = (phone, otp) => {
  return API.post("/auth/verify-otp", { phone, otp });
};

export const login = (email, password) => {
  return API.post("/auth/login", { email, password });
};

export const register = (userData) => {
  return API.post("/auth/register", userData);
};

export const firebaseLogin = (data) => {
  // Accept either just idToken (string) or object with idToken and phone
  if (typeof data === 'string') {
    return API.post("/auth/firebase-login", { idToken: data });
  }
  return API.post("/auth/firebase-login", data);
};
