import {
  Button,
  Grid,
  Box,
  Typography,
  Fade,
  Alert,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import Groups2Icon from '@mui/icons-material/Groups2';
import { useMediaQuery } from '@mui/material';

const RoomDisplay = ({
  room,
  isRoomVisible,
  locationName,
  getCurrentDate,
  newDate,
  handleRoomClick,
  handleClickBack,
  roomName,
  unavailable,
  available,
  moment,
  back,
  previous
}) => {
  
  const isMobile = useMediaQuery('(max-width:600px)');
  const [islast, setIsLast] = useState(false);
  // Effect to handle islast based on unavailable dates
  useEffect(() => {
    const hasPastDate = unavailable.some(item => { return moment(item.date).isBefore(moment(), 'day'); });
    setIsLast(hasPastDate);
  }, [unavailable, moment]); // Run when unavailable or moment changes
  
  return (
    <Grid item xs={12} md={6}>
      {isRoomVisible && (
        <>
          <Typography variant="h6" gutterBottom>
            รายชื่อห้องประชุมที่ {locationName} วันที่ {getCurrentDate(newDate)}
          </Typography>
          <Alert variant="outlined" severity="warning" sx={{ marginBottom: '12px' }}>
            โปรดเลือกห้องประชุมให้เหมาะสมกับจำนวนผู้เข้าประชุม ตามมาตรการการจำกัดจำนวนความจุของห้องประชุม เว้นระยะห่างอย่างน้อย 1 เมตร
          </Alert>
        </>
      )}

      <Box className="schedule">
        {isRoomVisible ? (
          <div id="item-room">
            <Grid container spacing={2}>
              {room.slice().map((roomItem, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Fade in={isRoomVisible}>
                    <Box
                      display="flex"
                      alignItems="center" // Aligns the icon and text vertically
                      justifyContent="flex-start" // Aligns the icon and text horizontally
                      className={!previous ? "room-item" : "room-item-disabled"}
                      onClick={
                        !previous ?
                        () => handleRoomClick(roomItem.room_id, roomItem.room_name, roomItem.room_warning, roomItem.room_detail,roomItem.room_size)
                        : null
                      }
                      sx={{ maxWidth: '100%', overflow: 'hidden' }}
                    >
                      <MeetingRoomIcon sx={{ marginRight: 1 }} />
                      <Typography sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1 }} >
                        {roomItem.room_name}
                      </Typography>
                    </Box>
                  </Fade>
                </Grid>
              ))}

            </Grid>
          </div>
        ) : (
          <div id="sub-item">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" gutterBottom>
                รายการจอง {roomName} วันที่ {getCurrentDate(newDate)}
              </Typography>
              {back && !isMobile && (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={handleClickBack}
                >
                  ย้อนกลับ
                </Button>
              )}

            </Box>
            {unavailable.length > 0 ? (
              <>
                {unavailable.map((item, index) => (
                  <Fade in={true} key={index}>
                    <Box
                      className={islast ? "schedule-item over" : "schedule-item booked"}
                      display="flex"
                      flexDirection="column"
                      alignItems="flex-start"
                      justifyContent="flex-start"
                      position="relative"
                    >
                      <Typography>
                        เวลา {item.startTime} - {item.endTime} {islast ? 'การประชุมจบไปแล้ว' : 'ไม่ว่าง'}
                      </Typography>
                      <Typography>หัวข้อ {item.description.replace(/&quot;/g, '"')}</Typography>
                      <Typography>ผู้จอง {item.meeting_reserver_name} เบอร์ติดต่อ {item.meeting_reserver_phone}</Typography>
                      <Groups2Icon sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', marginRight: '10px' }} />
                    </Box>
                  </Fade>
                ))}
              </>
            ) : (
              <Box
                className="schedule-item free"
                display="flex"
                flexDirection="column" // Stack the children vertically (time, description)
                alignItems="flex-start" // Align text and description to the left
                justifyContent="flex-start" // Align content to the top
                position="relative" // Needed to position the icon absolutely at the right
              >
                <Typography>ว่างทั้งวัน</Typography>
                <MeetingRoomIcon sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', marginRight: '10px' }} />
              </Box>
            )}

          </div>
        )}
      </Box>
    </Grid >
  )
}

export default RoomDisplay;