import React from 'react';
import { Button, Typography, Box, SvgIcon, Grid } from '@mui/material';
import ptt_logo from '../images/ptt_full_logo.png';
import meeting_room_img from '../images/m1.jpg';

const Login = ({ handleLogin }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      //minHeight="100vh" // Ensures the Box takes up the full height of the viewport
      overflow="hidden"
      sx={{
        backgroundColor: '#ffffff',
      }}
    >
      <Grid container height="100%">
        {/* Left Image Section */}
        <Grid
          item
          xs={12}
          md={8}
          lg={8}
          sx={{
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Box
            component="img"
            src={meeting_room_img}
            alt="meeting-room-img"
            sx={{
              width: '100%',
              height: '100vh', // Ensure the image covers the full height of the viewport
              objectFit: 'cover',
            }}
          />
        </Grid>

        {/* Login Form Section */}
        <Grid
          item
          xs={12}
          md={4}
          lg={4}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            backgroundColor: '#ffffff',
            padding: '20px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src={ptt_logo}
              alt="ptt_logo"
              sx={{ height: '80px', mb: 2 }}
            />
            <Typography variant="h5" component="h1" sx={{ mb: 1, fontWeight: '500', color: '#333' }}>
              Welcome to
            </Typography>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1d1366' }}>
              TSO Meeting Room Reservation
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, fontSize: '16px', color: '#666' }}>
            Please log in to continue
          </Typography>

          {/* Login Button */}
          <Button
            variant="contained"
            onClick={handleLogin}
            sx={{
              height: '150px',
              width: '200px',
              backgroundColor: '#1d1366',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                backgroundColor: '#15104d',
              },
            }}
          >
            <SvgIcon sx={{ fontSize: '50px', mb: 1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 640 640">
                <path fill="white" d="M.2 298.669L0 90.615l256.007-34.76v242.814H.201zM298.658 49.654L639.905-.012v298.681H298.657V49.654zM640 341.331l-.071 298.681L298.669 592V341.332h341.33zM255.983 586.543L.189 551.463v-210.18h255.794v245.26z" />
              </svg>

            </SvgIcon>
            <Typography sx={{ fontWeight: 'bold', fontSize: '18px' }}>
              PTT Users
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontSize: '14px', color: '#f5f5f5' }}>
              Login with Azure AD
            </Typography>
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;