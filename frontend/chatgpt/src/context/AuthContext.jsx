import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  checkAuthStatus,
  loginUser,
  logoutUser,
  signupUser,
} from "../helpers/api-communicator";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const data = await checkAuthStatus();
        if (data && data.name) {
          setUser({ email: data.email, name: data.name });
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.log("Auth status check:", error?.message || error);
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    if (data && data.name) {
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
      return data;
    }
    throw new Error(data?.message || "Failed to log in");
  };

  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    if (data && data.name) {
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
      return data;
    }
    throw new Error(data?.message || "Failed to sign up");
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    }
    setIsLoggedIn(false);
    setUser(null);
    window.location.href = "/login";
  };

  const value = {
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
