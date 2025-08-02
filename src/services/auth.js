import api from "./api";


export const login = async (email, password) => {
  try {
    const { data } = await api.post('/api/v1/Auth/login', { email, password });
    const token = data.token;

    if (token) {
      localStorage.setItem('token', token);
      return { success: true };
    }

    return { success: false, message: 'No token returned from server' };
  } catch (err) {
    // normalise every failure path
    const message =
      err?.response?.data?.message ||
      err?.message ||
      'Login failed. Please try again.';
    return { success: false, message };
  }
};


export const register = async (userData) => {
  try {
    const response = await api.post("/api/v1/Auth/register", userData);
    const token = response.data.token;

    if (token) {
      localStorage.setItem("token", token);
      return { success: true, token };
    } else {
      return { success: false, message: "No token received after registration" };
    }
  } catch (error) {
    const message =
      error.response?.data?.message || "Registration failed. Please try again.";
    return { success: false, message };
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await api.put("/api/v1/Profile/health-profile", profileData);
    
    if (response.status === 200) {
      return { success: true, message: "Profile updated successfully." };
    } else {
      return { success: false, message: "Unexpected response from server." };
    }
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to update health profile.";
    return { success: false, message };
  }
};

export const getProfile = async () => {
  try {
    const res = await api.get('/api/v1/Profile');
    return { success: true, data: res.data };
  } catch (err) {
    const message =
      err?.response?.data?.message || 'Unable to fetch profile.';
    return { success: false, message };
  }
};