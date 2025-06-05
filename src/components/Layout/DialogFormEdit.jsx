import React, { useEffect, useState } from 'react';
import moment from 'moment';
import {
  Button,
  Grid,
  Box,
  Slide,
  Typography,
  Toolbar,
  AppBar,
  Dialog,
  TextField,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import Loader from '../Loader/Loader';
import '../../css/BookingFormPage.css';
import { GetRoomByLocation } from '../../API/api';
import { times } from '../times';
import { convertTimeSlotsTo24HourFormat, checkAvailability } from '../CalendarUtils';
import RoomDisplay from './roomDisplay';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import { ModalCancle, SessionExpired, AlertRoom } from '../Alert/index';
import { softDelete } from '../../API/api';
import { decryptData, cleanFormData, getMealDetails, decodeHtmlEntities, updateInSide } from '../../utils/index';
import { useLocation } from 'react-router-dom';

import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers'
import { useMediaQuery } from '@mui/material';

import { getDataAzure, useLoginRequestAndStoredData } from '../../components/Azure/index';

const locale = 'en-gb';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MenuItemStyle = {
  fontSize: "1rem", // Font size for menu items
  padding: "4px 8px", // Internal padding for MenuItem
  minHeight: "30px", // Minimum height of each MenuItem
  width: "100%", // Make MenuItem take full width
  textAlign: "left", // Align text to the left
};

const SelectStyle = {
  marginLeft: '-10px',
  marginBottom: "12px",
  fontSize: "1.5rem", // Font size for selected text
  height: "25px", // Height of the select box
  textAlign: "left", // Align text to the left
  lineHeight: "1.2", // Line height for better spacing
  ".MuiSelect-select": {
    padding: "0", // Remove internal padding
    textAlign: "left", // Ensure text aligns to the left
  },
  ".MuiSelect-outlined": {
    display: "flex", // Ensure content alignment
    alignItems: "center", // Center align text vertically
  },
};

const FormControlStyle = {
  m: 1,
  "& .MuiInput-underline:before": {
    borderBottom: "1px solid #bdbdbd", // Default bottom line color
  },
  "& .MuiInput-underline:hover:before": {
    borderBottom: "1px solid #FE9900", // Bottom line color on hover
  },
  "& .MuiInput-underline:after": {
    borderBottom: "2px solid #FE9900", // Bottom line color when focused
  },
};


export default function FullScreenDialog({
  openForm,
  setOpenForm,
  newDate,
  location,
  locationName,
  events,
  roomIdx,
  roomNamex,
  detailRoom,
  setView,
  setModalIsOpen,
  date_edit,
  arrayRoom,
  roomArr
}) {
  const open = openForm;
  const today = moment().format('YYYY-MM-DD');
  const [moreThanThree, setMoreThanThree] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');
  const locationPath = useLocation();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [warning, setWarning] = useState('');
  const [detail, setDetail] = useState('');
  const [unavailable, setUnavailable] = useState([]);
  const [available, setAvailable] = useState([]);
  const getCurrentDate = (customDate) => customDate || moment().format('YYYY-MM-DD');
  const [videoConference, setVideoConference] = useState([]);
  const [roomType, setRoomType] = useState([]);
  const [catering, setCatering] = useState(0);
  const [room_size, setRoomSize] = useState('');
  const [room_details, setRoomDetails] = useState('');
  const dateSelect = arrayRoom[0].fix_date_start || moment().format('YYYY-MM-DD');
  const dateConvert = new Date(date_edit);
  const date_select = dateConvert.toLocaleDateString("en-US");
  //check admin to edit previous events
  const profile = getDataAzure();
  const { isAdminX } = useLoginRequestAndStoredData(profile);

  useEffect(() => {
    if (arrayRoom[0]) {
      const mealServiceData = decodeHtmlEntities(arrayRoom[0].meeting_catering_detail);
      const morningDetails = getMealDetails('morning', mealServiceData);
      const noonDetails = getMealDetails('lunch', mealServiceData);
      const eveningDetails = getMealDetails('afternoon', mealServiceData);
      const conferenceDetail = arrayRoom[0].meeting_conference_detail || "";
      const Microsoft = conferenceDetail.match(/Microsoft Teams/i) ? true : false;
      const CiscoWebex = conferenceDetail.match(/Cisco webex/i) ? true : false;
      const Zoom = conferenceDetail.match(/Zoom/i) ? true : false;
      setFormData((prevFormData) => ({
        ...prevFormData,
        date_start: arrayRoom[0].fix_date_start,
        date_end: arrayRoom[0].fix_date_end,
        startTime: arrayRoom[0].configTimeStart,
        endTime: arrayRoom[0].configTimeEnd,
        peopleCount: arrayRoom[0].meeting_participant_count,
        bookerName: arrayRoom[0].meeting_reserver_name,
        contactNumber: arrayRoom[0].meeting_reserver_phone,
        details: arrayRoom[0].meeting_description?.replace(/&quot;/g, '"') || '',
        topic: arrayRoom[0].description?.replace(/&quot;/g, '"'),
        meeting_room_type: arrayRoom[0].meeting_room_type || '',
        videoConference: arrayRoom[0].meeting_conference_detail ? true : false,
        meeting_video_id: arrayRoom[0].meeting_video_id || '',
        selectedOptionVideo: { 'Microsoft Teams': Microsoft, 'Cisco webex': CiscoWebex, 'Zoom': Zoom },
        room_name: roomName,
        bookerUnit: arrayRoom[0].meeting_department_name,
        mealService: {
          morning: morningDetails.check,
          noon: noonDetails.check,
          evening: eveningDetails.check,
        },
        mealOption: {
          morning: {
            menuList: morningDetails.menuList,
            time: morningDetails.time || '10:00',
            peoplenumber: morningDetails.peoplenumber,
            perbudget: morningDetails.perbudget,
            outside: checkRoom49(arrayRoom[0].room_id, morningDetails.outside),
            prepare: morningDetails.prepare
          },
          noon: {
            menuList: noonDetails.menuList,
            time: noonDetails.time || '12:00',
            peoplenumber: noonDetails.peoplenumber,
            perbudget: noonDetails.perbudget,
            outside: checkRoom49(arrayRoom[0].room_id, noonDetails.outside),
            prepare: noonDetails.prepare
          },
          evening: {
            menuList: eveningDetails.menuList,
            time: eveningDetails.time || '14:00',
            peoplenumber: eveningDetails.peoplenumber,
            perbudget: eveningDetails.perbudget,
            outside: checkRoom49(arrayRoom[0].room_id, eveningDetails.outside),
            prepare: eveningDetails.prepare
          },
        },
      }));
    }
  }, [arrayRoom, roomName]);

  const checkRoom49 = (room_id, default_value) => {
    return room_id === 49 ? 'ในห้อง' : default_value;
  }

  const [formData, setFormData] = useState({
    date_start: '',
    date_end: '',
    startTime: '',
    endTime: '',
    videoConference: false,
    selectedOptionVideo: {},
    meeting_room_type: '',
    mealService: { morning: false, noon: false, evening: false },
    mealOption: {
      morning: { menuList: '', time: '', peoplenumber: '', perbudget: '', outside: '', prepare: '' },
      noon: { menuList: '', time: '', peoplenumber: '', perbudget: '', outside: '', prepare: '' },
      evening: { menuList: '', time: '', peoplenumber: '', perbudget: '', outside: '', prepare: '' }
    },
    peopleCount: '',
    bookerName: '',
    bookerUnit: '',
    contactNumber: '',
    topic: '',
    details: '',
    meeting_video_id: '',
    room_name: ''
  });

  //Clear data videoconference
  useEffect(() => {
    if (!formData.videoConference && (formData.meeting_video_id !== '' || Object.keys(formData.selectedOptionVideo).length > 0)) {
      setFormData((prev) => ({
        ...prev,
        meeting_video_id: '',
        selectedOptionVideo: {}
      }));
    }
  }, [formData.videoConference]);


  useEffect(() => {
    const fetchRoom = async () => {
      if (location) {
        const roomData = await GetRoomByLocation(location);
        setRoom(roomData.data);
      }
    };
    fetchRoom();
  }, [location]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, date: dateSelect }));
  }, [dateSelect]);

  const handleChange = ({ target: { name, type, checked, value } }, timeValue) => {
    setFormData((prev) => {
      // Check if the change is related to videoConference options
      if (videoConference.includes(name)) {
        return { ...prev, selectedOptionVideo: { [name]: checked } };
      }
      // Handle string for meeting_room_type (single selection)
      if (name === 'meeting_room_type') {
        return { ...prev, [name]: value };  // Update meeting_room_type as a string
      }
      // Handle time value separately
      if (name === 'startTime' || name === 'endTime') { // Assuming 'meeting_time' is the name for the TimePicker
        const formattedTime = timeValue ? timeValue.format('HH:mm') : ''; // Format the selected time
        return { ...prev, [name]: formattedTime }; // Update the meeting time
      }
      // Handle other form data updates
      return { ...prev, [name]: type === 'checkbox' ? checked : value };
    });
  };


  const handleMealChange = ({ target: { name, checked } }) => {
    setFormData((prev) => ({
      ...prev,
      mealService: { ...prev.mealService, [name]: checked },
    }));
  };

  const [expire, setExpire] = useState(false);
  const [alertRoom, setAlertRoom] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = localStorage.getItem('userData');
    const userDatalocal = decryptData(userData);
    // Update room_id in arrayRoom[0]
    const selectedRoom = roomArr.find((room) => room.room_id === changeRoomId);
    if (selectedRoom) {
      arrayRoom[0] = {
        ...arrayRoom[0],
        room_id: changeRoomId, // Set room_id to the value of changeRoomId
        title: selectedRoom.room_name
      };
    }
    let code_tmp = userDatalocal.code.toLowerCase();
    const reulstCleanFormData = cleanFormData(formData, arrayRoom[0], code_tmp);
    const edit_item = async (meeting_id, isAdmin) => {
      const hrStart = parseInt(formData.startTime.split(':')[0]);
      const hrEnd = parseInt(formData.endTime.split(':')[0]);
      const mnStart = parseInt(formData.startTime.split(':')[1]);
      const mnEnd = parseInt(formData.endTime.split(':')[1]);
      const totalMinutesStart = hrStart * 60 + mnStart;
      const totalMinutesEnd = hrEnd * 60 + mnEnd;
      const date_start = new Date(formData.date_start);
      const date_end = new Date(formData.date_end);
      // คำนวณความแตกต่างของวัน
      const dayDifference = (date_end - date_start) / (1000 * 60 * 60 * 24);
      // คำนวณความแตกต่างของเวลา โดยรวมความแตกต่างของวัน
      const minuteDifference =
        dayDifference > 0
          ? totalMinutesEnd + dayDifference * 24 * 60 - totalMinutesStart
          : totalMinutesEnd - totalMinutesStart;
      // ตรวจสอบเงื่อนไข
      if (date_start > date_end) {
        setAlertRoom(true);
      } else if (minuteDifference < 0) {
        setAlertRoom(true);
      } else if (minuteDifference < 30) {
        setAlertRoom(true);
      } else {
        try {
          await softDelete(meeting_id, isAdmin, reulstCleanFormData, userDatalocal.code, 'update');
          // If successful, update localStorage and reload
          localStorage.setItem('save', 'true');
          localStorage.setItem('path', locationPath.pathname);
          window.location.reload();
        } catch (error) {
          console.error('Error in handleSubmit:', error);
          if (error.response.status === 401) {
            setExpire(true);
            return;
          };
          if (error.response.status === 500) {
            setAlertRoom(true);
            return;
          }
        }
      }
    };
    edit_item(arrayRoom[0].meeting_id, userDatalocal.isAdmin);
  };

  const handleClose = () => {
    setOpenForm(false);
    setLoading(true);
    setTimeout(() => { setLoading(false) }, 400); setModalIsOpen(false)
  };
  const [changeRoomId, setChangeRoomId] = useState(roomIdx);
  const [selectedValue, setSelectedValue] = useState("");
  const [roomNameChange, setroomNameChange] = useState(roomName);
  const handleSelectChange = (event) => {
    const selectedRoomId = event.target.value;
    // Set the selected value and room ID
    setSelectedValue(selectedRoomId);
    setChangeRoomId(selectedRoomId);
    // Find the matching room and get the room_name
    const selectedRoom = roomArr.find((room) => room.room_id === selectedRoomId);
    if (selectedRoom) {
      setroomNameChange(selectedRoom.room_name);
      setFormData((prevFormData) => ({
        ...prevFormData,
        room_name: selectedRoom.room_name, // Update room_name in formData
      }));
    }
  };

  useEffect(() => {
    if (changeRoomId > 0 || roomIdx > 0) {
      //check ห้องรับรองอาหาร เป็น ในห้อง
      if (changeRoomId === 49 || roomIdx === 49) {
        setFormData((prevData) => ({
          ...prevData,
          mealOption: updateInSide(prevData.mealOption)
        }));
      }
      const date = getCurrentDate(date_edit);
      const getRoom = room.filter((item) => item.room_id === changeRoomId);
      // Check if getRoom has any elements

      if (getRoom.length > 0) {
        setVideoConference(getRoom[0]?.room_conference || []);
        setRoomType(getRoom[0].room_type || []);
        setRoomSize(getRoom[0]?.room_size || null);
        setRoomDetails(getRoom[0]?.room_detail || null);
        setDetail(detail || null);
        setCatering(getRoom[0]?.room_catering || []);
      } else {
        // Handle the case where no room is found
        setRoomType([]); // or any default value you need
        setVideoConference([]);
        setCatering([]);
        setWarning(''); // Resetting or setting to a default warning
      }
      const matchingRooms = (Array.isArray(events) ? events : [events]).filter(
        (item) => item.room_id === changeRoomId && item.date === date
      );
      setUnavailable(matchingRooms);
      setRoomName(roomNamex);
      setWarning(warning);

      const availableTimes = checkAvailability(matchingRooms, times);
      const convertedSlots = convertTimeSlotsTo24HourFormat(availableTimes);
      setAvailable(convertedSlots);
      setDetail(detailRoom);
    }
  }, [roomIdx, roomNamex, room, events, newDate, detailRoom, changeRoomId]);

  //console.log(formData.mealOption.evening);
  const handleMealChangeOption = (meal, field, value) => {
    setFormData({
      ...formData,
      mealOption: {
        ...formData.mealOption,
        [meal]: {
          ...formData.mealOption[meal],
          [field]: value,
        },
      },
    });
  };

  const handleClickDelete = () => {
    setOpenConfirm(true)
  }


  useEffect(() => {
    // Calculate the difference in days
    const distanceInDays = dayjs(date_edit).diff(dayjs(today), 'days');
    // Check if the difference is greater than or equal to -3 days
    if (distanceInDays >= 3) {
      setMoreThanThree(true);
    }
  }, [date_edit, today]);

  const [islast, setIsLast] = useState(false);
  // Effect to handle islast based on unavailable dates
  useEffect(() => {
    const hasPastDate = unavailable.some(item => { return moment(item.date).isBefore(moment(), 'day'); });
    setIsLast(isAdminX ? false : hasPastDate);
  }, [unavailable, moment]);

  const [useRoomNameSelect, setUseRoomNameSelect] = useState("");
  const roomNameSelect = { roomName, roomNameChange };
  useEffect(() => {
    if (roomNameSelect.roomName !== '' && roomNameSelect.roomNameChange === '') {
      setUseRoomNameSelect(roomNameSelect.roomName);
    } else if (roomNameSelect.roomName !== '' && roomNameSelect.roomNameChange !== '') {
      setUseRoomNameSelect(roomNameSelect.roomNameChange);
    } else {
      setUseRoomNameSelect(roomNameSelect.roomName);
    }
  }, [roomNameSelect])

  if (loading) {
    return <Loader />
  }

  return (
    <>
      {alertRoom &&
        <AlertRoom
          open={alertRoom}
          setAlertRoom={setAlertRoom}
          textTitle={'ไม่สามารถเลือกในเวลานี้ได้'}
          textDetails={`ไม่สามารถเลือกในเวลานี้ได้ โปรดเลือกเวลาใหม่`}
          type={'roomTime'}
        />
      }
      {expire && (<SessionExpired />)}
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        scroll="paper"
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              แบบฟอร์มแก้ไขการจองห้องประชุมวันที่ {date_select}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between', // Space between left and right elements
              marginBottom: '6px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 9999 }} onClick={() => window.location.reload()}>
              <CalendarMonthIcon sx={{ marginRight: '8px', color: 'primary.main' }} />
              <Typography
                variant="h6"
                component="div"
                sx={{ cursor: 'pointer' }}
                color={'primary'}
                onClick={() => window.location.reload()}
              >
                <a onClick={() => window.location.reload()}>Back to Calendar</a>
              </Typography>
            </Box>

          </Box>

          <Grid container spacing={3}>
            {/* Schedule Section */}
            <RoomDisplay
              room={room}
              isRoomVisible={false}
              locationName={locationName}
              getCurrentDate={getCurrentDate}
              newDate={date_select}
              roomName={useRoomNameSelect}
              unavailable={unavailable}
              available={available}
              moment={moment}
              back={false}
            />
            <br />
            {/* Booking Form */}
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" sx={FormControlStyle}>
                <Select
                  value={selectedValue || changeRoomId || roomIdx}
                  onChange={handleSelectChange}
                  displayEmpty
                  size="small"
                  sx={SelectStyle}
                  disabled={islast}
                >
                  {roomArr.map((item) => (
                    <MenuItem key={item.room_id} value={item.room_id} sx={MenuItemStyle}>
                      {item.room_name}
                      {item.room_size || item.room_detail ?
                        ` (${item.room_size ? item.room_size + ' คน' : ''}${item.room_size && item.room_detail ? ' ' : ''}${item.room_detail || ''})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                {/* Date Field */}

                <Typography variant="body1" color={'primary'} style={{ marginTop: 8, marginLeft: '16px' }}>
                  โปรดเลือกเวลาเริ่มใช้งาน ให้ตรงตามจริง เพื่อให้ทีมบริการห้องประชุม บริการท่านได้ อย่างมีประสิทธิภาพ
                </Typography>
                {[
                  { label: "วันที่เริ่ม", type: "date", name: "date_start", value: formData.date_start },
                  { label: "เวลาเริ่ม", type: "time", name: "startTime", value: formData.startTime },
                  { label: "วันที่สิ้นสุด", type: "date", name: "date_end", value: formData.date_end },
                  { label: "เวลาสิ้นสุด", type: "time", name: "endTime", value: formData.endTime },
                ].map((field, index) => (
                  <Grid item xs={6} key={index}>
                    {field.type === 'time' ? (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
                        <TimePicker
                          ampm={false}
                          label={field.label}
                          onChange={(newValue) => handleChange({ target: { name: field.name } }, newValue)}
                          value={field.value ? dayjs(field.value, 'HH:mm') : null}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          disabled={islast}
                        />
                      </LocalizationProvider>
                    ) : (
                      <TextField
                        size="small"
                        fullWidth
                        label={field.label}
                        type={field.type}
                        name={field.name}
                        value={field.value}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        disabled={islast}
                      />)

                    }

                  </Grid>
                ))}
                <Typography
                  variant="body1"
                  color={'primary'}
                  style={{ marginTop: 8, marginLeft: '16px', marginBottom: '-12px', cursor: 'pointer' }}
                  onClick={() => { setView('day'); handleClose(); }}
                >
                  ดูตารางการจองแยกตามห้องประชุม
                </Typography>
                {/* Video Conference */}
                <Grid item xs={12}>
                  {videoConference.length > 0 && (
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      {/* Main Checkbox */}
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="videoConference"
                            checked={formData.videoConference}
                            onChange={handleChange}
                          />
                        }
                        label="ใช้ Video Conference"
                        disabled={islast}
                      />
                      {/* Conditional Checkboxes */}

                      {formData.videoConference && videoConference.length > 0 && (
                        <FormGroup row>
                          {videoConference.map((option) => (
                            <FormControlLabel
                              key={option}
                              control={
                                <Checkbox
                                  name={option}
                                  checked={!!formData.selectedOptionVideo[option]}
                                  onChange={handleChange}
                                />
                              }
                              label={option}
                              disabled={islast}
                            />
                          ))}
                        </FormGroup>
                      )}
                    </Box>
                  )}
                  {formData.videoConference && videoConference.map((option) =>
                    formData.selectedOptionVideo[option] && (
                      <TextField
                        key={option}
                        size="small"
                        fullWidth
                        label={`หมายเลข video id ของ ${option}`}
                        style={{ marginBottom: '10px' }}
                        required
                        value={formData.meeting_video_id || ''} // Directly access the single value
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            meeting_video_id: e.target.value, // Directly store the value
                          }))
                        }
                        disabled={islast}
                      />
                    )
                  )}
                  {!formData.videoConference && videoConference.length > 0 && (
                    <Typography variant="body1" color={'red'} style={{ marginTop: 0, marginBottom: '10px' }}>
                      กรณีไม่ได้เลือก ใช้งาน Video conference จะไม่มีเจ้าหน้าที่ PTT Digital มาเตรียมระบบ Video conference ให้ท่าน
                    </Typography>
                  )}
                  {roomType.length > 0 && (
                    <FormControl fullWidth sx={{ top: '10px' }}>
                      <InputLabel id="select-roomType" sx={{ top: '-8px' }}  >เลือกรูปแบบห้อง</InputLabel>
                      <Select
                        labelId="select-roomType"
                        size="small"
                        value={formData.meeting_room_type}
                        onChange={handleChange}
                        name="meeting_room_type"
                        label="เลือกรูปแบบห้อง"
                        disabled={islast}
                      >
                        {roomType.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                </Grid>

                {/* Meal Services */}
                {catering > 0 && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="subtitle1" sx={{ marginRight: 1 }}>
                        บริการอาหารเบรค
                      </Typography>
                      {!moreThanThree && !Object.values(formData.mealService).some((value) => value) && !isMobile && (
                        <Typography variant="body1" color="red">
                          ไม่สามารถเลือกบริการอาหารได้เนื่องจากต้องจองล่วงหน้า 3 วัน
                        </Typography>
                      )}
                    </Box>
                    {!moreThanThree && !Object.values(formData.mealService).some((value) => value) && isMobile && (
                      <Typography variant="body1" color={'red'}>
                        ไม่สามารถเลือกบริการอาหารได้เนื่องจากต้องจองล่วงหน้า 3 วัน
                      </Typography>
                    )}
                    <FormGroup row sx={{ marginBottom: '-10px' }}>
                      {['morning', 'noon', 'evening'].map((meal, idx) => (
                        <FormControlLabel
                          key={idx}
                          control={
                            <Checkbox
                              name={meal}
                              checked={formData.mealService[meal]}
                              onChange={handleMealChange}
                              disabled={!moreThanThree && !formData.mealService[meal]}
                            />
                          }
                          label={meal === 'morning' ? 'เช้า' : meal === 'noon' ? 'กลางวัน' : 'บ่าย'}
                          disabled={islast}
                        />
                      ))}
                    </FormGroup>

                    {/* Conditionally Render TextFields and Selects Side by Side */}
                    {['morning', 'noon', 'evening'].map((meal) =>
                      formData.mealService[meal] ? (
                        <>
                          <Grid key={meal} item xs={12} container spacing={1} alignItems="center" style={{ marginBottom: '12px', marginTop: '12px' }}>
                            {/* TextField */}

                            <Grid item xs={2}>
                              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
                                <TimePicker
                                  ampm={false}
                                  name={meal}
                                  label={
                                    meal === 'morning'
                                      ? 'เวลาเบรคเช้า'
                                      : meal === 'noon'
                                        ? 'เวลากลางวัน'
                                        : 'เวลาเบรคบ่าย'
                                  }
                                  onChange={(value) => handleMealChangeOption(meal, 'time', value?.format('HH:mm'))}
                                  value={formData.mealOption[meal]?.time ? dayjs(formData.mealOption[meal].time, 'HH:mm') : null}
                                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                  disabled={islast}
                                />
                              </LocalizationProvider>
                            </Grid>
                            <Grid item xs={2}>
                              <TextField
                                size="small"
                                fullWidth
                                label={'จำนวนคน'}
                                type="number"
                                name={meal}
                                value={formData.mealOption[meal]?.peoplenumber || ''}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => handleMealChangeOption(meal, 'peoplenumber', e.target.value)}
                                disabled={islast}
                              />
                            </Grid>
                            <Grid item xs={3}>
                              <TextField
                                size="small"
                                fullWidth
                                label={'งบต่อหัว'}
                                type="number"
                                name={meal}
                                value={formData.mealOption[meal]?.perbudget || ''}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => handleMealChangeOption(meal, 'perbudget', e.target.value)}
                                disabled={islast}
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <Select
                                name={meal}
                                fullWidth
                                value={formData.mealOption[meal].outside}
                                size="small"
                                onChange={(e) => handleMealChangeOption(meal, 'outside', e.target.value)}
                                disabled={islast}
                              >
                                <MenuItem value="นอกห้อง">นอกห้อง</MenuItem>
                                <MenuItem value="ในห้อง">ในห้อง</MenuItem>
                              </Select>
                            </Grid>
                            {/* Select */}
                            <Grid item xs={3}>
                              <Select
                                name={meal}
                                fullWidth
                                value={formData.mealOption[meal].prepare}
                                size="small"
                                onChange={(e) => handleMealChangeOption(meal, 'prepare', e.target.value)}
                                disabled={islast}
                              >
                                <MenuItem value="ผู้จองเตรียมเอง">ผู้จองเตรียมเอง</MenuItem>
                                <MenuItem value="ให้ บล. เตรียม">ให้ บล. เตรียม</MenuItem>
                              </Select>
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                size="small"
                                fullWidth
                                label={
                                  meal === 'morning'
                                    ? 'รายการอาหารเบรคเช้า'
                                    : meal === 'noon'
                                      ? 'รายการอาหารกลางวัน'
                                      : 'รายการอาหารเบรคบ่าย'
                                }
                                name={meal}
                                multiline
                                value={formData.mealOption[meal]?.menuList || ''}
                                rows={1}
                                onChange={(e) => handleMealChangeOption(meal, 'menuList', e.target.value)}
                                disabled={islast}
                              />
                            </Grid>
                          </Grid>
                          <Divider />
                        </>
                      ) : null
                    )}
                  </Grid>
                )}
                {/* Other Fields */}
                {[
                  { name: 'peopleCount', label: 'จำนวนคน', type: 'number' },
                  { name: 'bookerName', label: 'ผู้จอง', type: 'text' },
                  { name: 'bookerUnit', label: 'หน่วยงาน', type: 'text' },
                  { name: 'contactNumber', label: 'เบอร์ติดต่อ', type: 'text' },
                  { name: 'topic', label: 'หัวข้อ', type: 'text' },
                ].map((field, idx) => (
                  <Grid item xs={12} key={idx}>
                    <TextField
                      size="small"
                      fullWidth
                      label={field.label}
                      type={field.type}
                      name={field.name}
                      //InputProps={{ readOnly: field.name === 'bookerName' }}
                      value={formData[field.name]}
                      onChange={handleChange}
                      disabled={islast}
                    />
                  </Grid>
                ))}

                {/* Details */}
                <Grid item xs={12}>
                  <TextField
                    size="small"
                    fullWidth
                    label="รายละเอียด"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    multiline
                    rows={5}
                    disabled={islast}
                  />
                </Grid>

                {/* Buttons */}
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button size="small" variant="outlined" color="error" startIcon={<CancelPresentationIcon />} onClick={handleClickDelete} >
                    ลบรายการ
                  </Button>
                  <Button size="small" variant="outlined" color="warning" onClick={handleClose} >
                    ย้อนกลับ
                  </Button>
                  <Button size="small" variant="contained" color="primary" onClick={handleSubmit} disabled={islast}>
                    บันทึก
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Dialog >
      <ModalCancle
        room_id={arrayRoom[0].room_id}
        meeting_id={arrayRoom[0].meeting_id}
        openConfirm={openConfirm}
        setOpenConfirm={setOpenConfirm}
        title={arrayRoom[0].title_name || arrayRoom[0].title}
        dateStart={arrayRoom[0].fix_date_start_text || arrayRoom[0].textStart}
        dateEnd={arrayRoom[0].fix_date_end_text || arrayRoom[0].textEnd}
        setModalIsOpen={setModalIsOpen}
        letOpen={true}
      />
    </>
  );
}
