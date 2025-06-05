import React, { useEffect, useState } from 'react';
import BigCalendar from '../components/Calendar/BigCalendar';
import NoPermission from './NoPermissionPage';
import '../css/MainPage.css';
import { FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import Navbar from '../components/Navbar/Navbar';
import { GetRoomByLocation, GetAllLocations } from '../API/api';
import Loader from '../components/Loader/Loader'
import { SessionExpired } from '../components/Alert/index';
import { useCheckSessionExpired } from '../components/Error/index';
import { getDataAzure, useLoginRequestAndStoredData } from '../components/Azure/index';
import { ResizeDesktop } from '../components/Desktop/index';
import axios from 'axios';

const MainPage = ({ handleLogout }) => {
  const [openLoading, setLoadingOpen] = useState(true);
  const [userData, setUserData] = useState([]);
  const [location, setLocation] = useState('1');
  const [locationName, setLocationName] = useState('ศูนย์ปฏิบัติการระบบท่อ ชลบุรี');
  const [roomName, setRoomName] = useState('');
  const [room, setRoom] = useState(0);
  const [roomArr, setRoomArr] = useState([]);
  const [locationArr, setLocationArr] = useState([])
  const [allow, setAllow] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const profile = getDataAzure();
  const expire = useCheckSessionExpired(userData);
  const windowWidth = ResizeDesktop();
  const { userDataX, isAdminX, allowX, openLoadingX } = useLoginRequestAndStoredData(profile);

  useEffect(() => {
    // Axios POST request with error and timeout handling
    axios
      .post("https://pmis.pipeline.pttplc.com/WebVisitorCounter/?Page=MeetingRoom", null, {
        timeout: 5000, // 5-second timeout
      })
      .then((response) => {
        if (response.status !== 200) {
          console.error("Error in API response:", response.statusText);
        }
      })
      .catch((error) => {
        if (error.code === "ECONNABORTED") {
          console.error("Request timed out");
        } else {
          console.error("Error occurred during API call:", error.message);
        }
      });
  }, []);

  useEffect(() => {
    setUserData(userDataX); setIsAdmin(isAdminX); setAllow(allowX); setLoadingOpen(openLoadingX);
  }, [userDataX, isAdminX, allowX, openLoadingX])

  // Fetch room data when 1st open and refresh if location changes
  useEffect(() => {
    if (roomArr.length === 0) {
      setLoadingOpen(true);
      const getRoomData = async () => {
        try {
          const roomData = await GetRoomByLocation(location);
          const locationData = await GetAllLocations();
          setRoomArr(roomData.data);
          // console.log(roomData.data)
          setLocationArr(locationData.data)
          // localStorage.setItem('roomArr', JSON.stringify(roomData.data));
        } catch (err) {
          console.error(err);
        }
      };
      getRoomData();
    } else if (roomArr.length !== 0 && userData && locationArr.length !== 0) {
      setLoadingOpen(false);
      // const room = JSON.parse(localStorage.getItem("roomArr"));
      // console.log(room)
    }

  }, [roomArr, location, userData, locationArr]);

  const handleLocationChange = (event) => {
    const selectedLocationId = event.target.value;
    setLocation(event.target.value);
    setRoomArr([]);
    setRoom(0); // Reset room selection when location changes
    const selectedLocation = locationArr.find(
      (ele) => ele.location_id === selectedLocationId
    );
    if (selectedLocation) {
      setLocationName(selectedLocation.location_name); // Update the location name
    }
  };
  const [detailRoom, setDetailRoom] = useState('');
  const handleRoomChange = (event) => {
    const selectedRoomId = event.target.value; // Get selected room_id
    setRoom(selectedRoomId); // Update the state with the selected room_id
    const selectedRoom = roomArr.find((ele) => ele.room_id === selectedRoomId); // Find the selected room
    if (selectedRoom) {
      setRoomName(selectedRoom.room_name); // Log the room_name
      setDetailRoom(selectedRoom.room_detail);
    }
  };

  return (
    <>
      {allow ? (
        <>
          {expire && (<SessionExpired />)}
          {openLoading && (<Loader />)}
          <Navbar handleLogout={handleLogout} data={userData} setLoading={setLoadingOpen} isAdmin={isAdmin} />
          <div className="App">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1rem',
                paddingBottom: '0.5rem',
              }}
            >
              <p style={{ fontSize: '16px', fontWeight: 'bold' }}>สถานที่</p>
              <FormControl
                variant="outlined"
                style={{ minWidth: 120, flex: '1 1 auto' }}
                size="small"
              >
                <InputLabel id="location-label"></InputLabel>
                <Select
                  labelId="location-label"
                  value={location}
                  onChange={handleLocationChange}
                >
                  {locationArr.slice().map((ele) => (
                    <MenuItem key={ele.location_id} value={ele.location_id}>
                      {ele.location_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                variant="outlined"
                style={{ minWidth: 120, flex: '1 1 auto' }}
                disabled={!location}
                size="small"
              >
                <InputLabel id="room-label"></InputLabel>
                <Select
                  labelId="room-label"
                  value={room}
                  onChange={handleRoomChange}
                >
                  <MenuItem value={0}>ทั้งหมด</MenuItem>
                  {roomArr.map((ele) => (
                    <MenuItem key={ele.room_id} value={ele.room_id}>
                      {ele.room_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={() => {
                  setOpenForm(true);
                }}
                alt="booking-btn"
              >
                จองห้องประชุม
              </Button>
            </div>
            <div
              className="calendar-container"
              style={{
                width: '100%',
                overflowX: 'auto', // Handles overflow for small screens
                padding: '1rem',
                marginTop: '-25px'
              }}
            >
              <BigCalendar
                roomArr={roomArr}
                openForm={openForm}
                setOpenForm={setOpenForm}
                windowWidth={windowWidth}
                location={location}
                locationName={locationName}
                room={room}
                roomName={roomName}
                detailRoom={detailRoom}
                sx={{ width: '100%' }}
                isAdmin={isAdmin}
                userCode={userData.code}
              />
            </div>
          </div>
        </>
      ) : (
        <NoPermission handleLogout={handleLogout} setAllow={setAllow} />
      )}
    </>
  );
};

export default MainPage;

