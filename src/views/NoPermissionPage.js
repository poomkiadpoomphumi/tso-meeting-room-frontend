// import React from 'react';
// import { Container, Typography, Button, Box } from '@mui/material';
// import xSign from '../images/xSign.png'

// const NoPermission = ({ handleLogout, setAllow }) => {
//   return (
//     <Container maxWidth="sm" style={{ textAlign: 'center', marginTop: '20vh' }}>
//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           p: 2,
//           border: '1px solid #ccc',
//           borderRadius: '8px',
//           backgroundColor: '#f9f9f9'
//         }}
//       >
//         <img src={xSign} alt='sign' style={{ height: '70px', marginBottom: '10px'}}/>
//         <Typography variant="h6" gutterBottom>
//           You don't have permission to access this website !
//         </Typography>
//         <Typography variant="body1" gutterBottom>
//           โปรดติดต่อ คุณปกป้อง (คป.บคต.) โทร 35395
//         </Typography>
//         <Box mt={2}>
//           <Button variant="contained" color="primary" onClick={handleLogout} sx={{ mb: 2 }}>
//             Back
//           </Button>
//           {/* <Button variant="outlined" color="secondary" onClick={() => setAllow(true)}>
//             Allow
//           </Button> */}
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default NoPermission;

import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import { useMsal } from '@azure/msal-react';

export default function NoPermission() {
  const { instance } = useMsal();
  const handleListItemClick = (event, index) => {
    instance.logoutPopup().catch(console.error);
    localStorage.clear();
  };
  return (
    <React.Fragment>
      <Dialog
        fullScreen
        open={true}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <DialogContentText id="alert-dialog-description" sx={{
            fontSize: '25px'
          }}>
            <b style={{ color: 'red', fontSize: '50px' }}>Permission Denied</b><br />
            {/* คุณไม่มีสิทธิ์เข้าถึงหน้านี้ <br /> */}
            หากมีข้อสงสัยโปรดติดต่อ คุณปกป้อง (คป.) Tel. 35395
          </DialogContentText>
          <br />
          <Button
            variant="outlined" size="large"
            onClick={handleListItemClick} color="error"
            sx={{ fontSize: '1.25rem', padding: '3px 14px' }} autoFocus>LOGOUT</Button>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}