import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../authConfig';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { getUserProfile } from '../../API/AzureAd';
import { sendTokenToBackend, Login } from '../../API/api';
import { encryptData, decryptData } from '../../utils/index';

export const getDataAzure = () => {
  const { instance, accounts } = useMsal();
  const [profile, setProfile] = useState(null);
  // Fetch user profile from Microsoft Server
  const isTokenExpired = (token) => {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    // console.log(payload + " " + expiry + " " + now)
    return now > expiry;
  };
  useEffect(() => {
    const fetchProfile = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken && !isTokenExpired(storedToken)) {
        try {
          const userProfile = await getUserProfile(storedToken);
          await sendTokenToBackend(storedToken);
          setProfile(userProfile);
        } catch (e) {
          console.error("Failed to reuse stored token", e);
          localStorage.removeItem('accessToken');
        }
      } else {
        //   console.log('get new token')
        const request = { ...loginRequest, account: accounts[0] };
        try {
          const response = await instance.acquireTokenSilent(request);
          const userProfile = await getUserProfile(response.accessToken);
          await sendTokenToBackend(response.accessToken);
          setProfile(userProfile);
          localStorage.setItem('accessToken', response.accessToken);
        } catch (e) {
          if (e instanceof InteractionRequiredAuthError) {
            instance.acquireTokenPopup(request).then((response) => {
              getUserProfile(response.accessToken).then((userProfile) => {
                setProfile(userProfile);
                localStorage.setItem('accessToken', response.accessToken);
              });
            });
          }
        }
      }
    };
    fetchProfile();
  }, [instance, accounts]);
  return profile;
}

export const useLoginRequestAndStoredData = (profile) => {
  // Fetch user profile from iPortal and check permission
  const [userDataX, setUserData] = useState([]);
  const [isAdminX, setIsAdmin] = useState(false);
  const [allowX, setAllow] = useState(true);
  const [openLoadingX, setLoadingOpen] = useState(true);
  useEffect(() => {
    const init = async () => {
      try {
        const storedUserData = localStorage.getItem('userData');
        const storedToken = localStorage.getItem('accessToken');
        if (storedUserData) {
          const decryptedData = decryptData(storedUserData);
          setUserData(decryptedData);
          setIsAdmin(decryptedData.isAdmin);
          if (decryptedData.isAdmin === true) {
            setAllow(true);
          }
          setLoadingOpen(false);
          return;
        }
        if (profile !== null && storedToken) {
          const code = profile.userPrincipalName.split('@')[0];
          const loginData = await Login(code.toLowerCase());
          if (loginData.data && loginData.data.allow) {
            const userDataToStore = {
              ...loginData.data.data,
              isAdmin: loginData.data.isAdmin,
            };
            const encryptedData = encryptData(userDataToStore);
            localStorage.setItem('userData', encryptedData);
            setUserData(userDataToStore);
            setIsAdmin(loginData.data.isAdmin);
            if (loginData.data.isAdmin === true) {
              setAllow(true);
            }
          }
        }
        setLoadingOpen(false);
      } catch (err) {
        console.error('Error during initialization:', err);
        setAllow(false);
        setLoadingOpen(false);
      }
    };
    init();
  }, [profile]);
  return { userDataX, isAdminX, allowX, openLoadingX }
}