"use client"
import { ReactNode, useCallback, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import useLocalStorage from "../hooks/use-local-storage";
import { LOCAL_STORAGE_KEYS } from "../constants/localStorageKeys";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { getAuthUserDetails, setAuthUserDetails, setAuthToken } from "@/store/auth-slice";
import { AuthUserDetails } from "@/models/Auth/authUserDetails";
import { handleFetchCurrentUser } from "@/services/administration/administrationRequest";

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useLocalStorage(LOCAL_STORAGE_KEYS.AUTH, undefined); //useState<string | undefined>(undefined);
  // const [userDetails, setUserDetails] = useLocalStorage(LOCAL_STORAGE_KEYS.USER_DETAILS, undefined); //useState<string | undefined>(undefined);
  const dispatch = useAppDispatch();
  const userDetails = useAppSelector(getAuthUserDetails);

  // update user details in redux
  const setUserDetails = useCallback(async (details: AuthUserDetails | undefined) => {
    dispatch(setAuthUserDetails(details))
  }, [dispatch])

  // when token is obtained, add to reducer ( token current not fetched from redux. ONLY LOCAL STORAGE)
  useEffect(() => {
    dispatch(setAuthToken(token))
  }, [dispatch, token])

  // Fetch user details when token is available
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (token && !userDetails) {
        try {
          const response = await handleFetchCurrentUser(token);
          if (response.data) {
            dispatch(setAuthUserDetails(response.data));
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
    };

    fetchUserDetails();
  }, [token, userDetails, dispatch]);


  return (
    <AuthContext.Provider value={{ token, setToken, userDetails, setUserDetails }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;