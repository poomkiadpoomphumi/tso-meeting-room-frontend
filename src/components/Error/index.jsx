import { useEffect, useState } from 'react';
import { Login } from '../../API/api';

export const useCheckSessionExpired = (userData) => {
  // Retrieve the value from localStorage on initial render
  const [expire, setExpire] = useState(() => {
    return JSON.parse(localStorage.getItem("expire")) || false;
  });

  useEffect(() => {
    const checkExpire = async () => {
      try {
        if (!expire) {
          await Login(userData.code); // Call your `Login` function here
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setExpire(error.response.data.expired);
          localStorage.setItem("expire", JSON.stringify(error.response.data.expired)); // Save to localStorage
        } else {
          console.error(error.message);
        }
      }
    };

    if (userData?.code && !expire) {
      checkExpire();
    }
  }, [userData, expire]);

  // Update localStorage whenever `expire` changes
  useEffect(() => {
    localStorage.setItem("expire", JSON.stringify(expire));
  }, [expire]);

  return expire;
};
