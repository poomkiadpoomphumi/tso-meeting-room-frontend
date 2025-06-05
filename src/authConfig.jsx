// import { LogLevel } from '@azure/msal-browser';

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: import.meta.env.VITE_AUTHORITY,
    redirectUri: 'https://tso-meeting-room.pttplc.com/',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  // system: {
  //   loggerOptions: {
  //     loggerCallback: (level, message, containsPii) => {
  //       if (containsPii) {
  //         return;
  //       }
  //       // switch (level) {
  //       //   case LogLevel.Error:
  //       //     console.error(message);
  //       //     break;
  //       //   case LogLevel.Info:
  //       //     console.info(message);
  //       //     break;
  //       //   case LogLevel.Verbose:
  //       //     console.debug(message);
  //       //     break;
  //       //   case LogLevel.Warning:
  //       //     console.warn(message);
  //       //     break;
  //       //   default:
  //       //     // Optionally, handle other levels or log a generic message
  //       //     console.log(message);
  //       //     break;
  //       // }
  //     },
  //   },
  // }
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'User.Read']
};
