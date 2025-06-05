import React, { useCallback, useEffect, useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import Loader from '../Loader/Loader';
import '../../css/BookingFormPage.css';
import { GetRoomByLocation, createBooking } from '../../API/api';
import { times } from '../times';
import { convertTimeSlotsTo24HourFormat, checkAvailability } from '../CalendarUtils';
import RoomDisplay from './roomDisplay';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { decryptData, cleanFormData, checkRuleLocation, updateInSide, updateOutSide } from '../../utils/index';
import Snackbar from '../Snackbar/SnackBar';

import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers'
import { AlertLocation, AlertRoom, SessionExpired } from '../Alert/index';
import { useMediaQuery } from '@mui/material';

const locale = 'en-gb';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function FullScreenDialog({
  roomArr,
  openForm,
  setOpenForm,
  newDate,
  setNewDate,
  location,
  locationName,
  events,
  roomIdx,
  roomNamex,
  detailRoom,
  setView,
  previous,
}) {
  const formatNewDate = (newDate) => {
    if (newDate === '') {
      return '';
    }
    const [year, month, day] = newDate.split('-');
    const formattedMonth = month.padStart(2, '0');
    const formattedDay = day.padStart(2, '0');
    return `${year}-${formattedMonth}-${formattedDay}`;
  }
  const open = openForm;
  const isMobile = useMediaQuery('(max-width:600px)');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState([]);
  const [disabled, setDisabled] = useState(true);
  const [isRoomVisible, setRoomVisible] = useState(true);
  const [warning, setWarning] = useState('');
  const [detail, setDetail] = useState('');
  const [unavailable, setUnavailable] = useState([]);
  const [room_idx, setRoomIdx] = useState('');
  const [available, setAvailable] = useState([]);
  const getCurrentDate = (customDate) => customDate || moment().format('YYYY-MM-DD');
  const [moreThanThree, setMoreThanThree] = useState(false);
  const today = moment().format('YYYY-MM-DD');
  const userData = localStorage.getItem('userData');
  const [userDatalocal, setUserDatalocal] = useState('');
  const [alertRoom, setAlertRoom] = useState(false);
  const [alertSuccess, setAlert] = useState(false);
  const letDate = newDate === '' ? today : formatNewDate(newDate);
  const dateConvert = new Date(letDate);
  const dateclick = dateConvert.toLocaleDateString("en-US");
  const [roomName, setRoomName] = useState('');
  /* Start check rule location */
  const [accessForm, setAccessForm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  useEffect(() => {
    if (location && openForm) {
      const response = checkRuleLocation(location);
      setAccessForm(response);
      setShowAlert(!response);
    }
  }, [location, openForm]);
  /* End check rule location */

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date_start: letDate,
      date_end: letDate,
      room_name: roomName
    }));

    if (userData) {
      const decryptArray = decryptData(userData);
      setUserDatalocal(decryptArray);
    }
    setNewDate(formatNewDate(newDate));
  }, [userData, newDate, letDate, setNewDate, roomName])


  useEffect(() => {
    if (userDatalocal) {
      setFormData((prev) => ({
        ...prev,
        bookerName: userDatalocal.fname + ' ' + userDatalocal.lname,
        bookerUnit: userDatalocal.unitabbr,
        contactNumber: userDatalocal.mobile
      }));
    }
  }, [userDatalocal])

  const [formData, setFormData] = useState({
    date_start: '',
    date_end: '',
    startTime: '08:00',
    endTime: '17:00',
    videoConference: false,
    selectedOptionVideo: {},
    meeting_room_type: '',
    mealService: { morning: false, noon: false, evening: false },
    mealOption: {
      morning: { menuList: '', time: '10:00', peoplenumber: '', perbudget: '', outside: 'นอกห้อง', prepare: 'ผู้จองเตรียมเอง' },
      noon: { menuList: '', time: '12:00', peoplenumber: '', perbudget: '', outside: 'นอกห้อง', prepare: 'ผู้จองเตรียมเอง' },
      evening: { menuList: '', time: '14:00', peoplenumber: '', perbudget: '', outside: 'นอกห้อง', prepare: 'ผู้จองเตรียมเอง' }
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

  const ClearDataInput = () => {
    setFormData((prev) => ({
      ...prev,
      videoConference: false,
      mealService: { morning: false, noon: false, evening: false },
      meeting_room_type: '',
      peopleCount: '',
      topic: '',
      details: '',
    }));
  }

  useEffect(() => {
    const fetchRoom = async () => {
      if (location) {
        const roomData = await GetRoomByLocation(location);
        setRoom(roomData.data);
      }
    };
    fetchRoom();
  }, [location]);

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
      if (name === 'peopleCount') {
        const numberValue = parseInt(value, 10);
        return { ...prev, [name]: numberValue < 0 ? 0 : numberValue };
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

  const [errorInput, setErrorInput] = useState({
    peopleCount: false,
    topic: false,
    videoNumber: false,
    meeting_room_type: false
  });

  const [warningConferance, setWarningConference] = useState(false);
  const [videoConference, setVideoConference] = useState([]);
  const [roomType, setRoomType] = useState([]);
  const [catering, setCatering] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [minuteError, setMinuteError] = useState(false);
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e) => {
    /*     const hrStart = parseInt(formData.startTime.split(':')[0]);
        const hrEnd = parseInt(formData.endTime.split(':')[0]);
        const mnStart = parseInt(formData.startTime.split(':')[1]);
        const mnEnd = parseInt(formData.endTime.split(':')[1]);
        const totalMinutesStart = hrStart * 60 + mnStart;
        const totalMinutesEnd = hrEnd * 60 + mnEnd;
        const minuteDifference = totalMinutesEnd - totalMinutesStart; */
    const date_start = new Date(formData.date_start);
    const date_end = new Date(formData.date_end);

    if (date_start > date_end) {
      setAlertRoom(true);
    } /* else if (minuteDifference < 0) {
      setAlertRoom(true);
    } else if (minuteDifference < 30) {
      setAlertRoom(true);
      setMinuteError(true);
    }  */else {
      const errors = {
        peopleCount: formData.peopleCount === '',
        topic: formData.topic === '',
        videoNumber: formData.meeting_video_id === '',
        meeting_room_type: formData.meeting_room_type === ''
      };
      setErrorInput(errors);
      setTimeout(() => {
        setErrorInput({
          peopleCount: formData.peopleCount === false,
          topic: formData.topic === false,
          videoNumber: formData.meeting_video_id === false,
          meeting_room_type: formData.meeting_room_type === false
        });
      }, 1000)
      // If there are any errors, stop the submission
      if (errors.peopleCount || errors.topic) {
        return;
      }
      if (roomType.length > 0 && errors.meeting_room_type) {
        const errors = {
          meeting_room_type: formData.meeting_room_type === ''
        };
        setErrorInput(errors);
      } else {
        if (!confirm) {
          if (!formData.videoConference) {
            if (videoConference.length > 0) {
              if (formData.videoConference === false) {
                setWarningConference(true);
              } else {
                setWarningConference(false);
              }
            }
          }
        }
        if (confirm || formData.meeting_room_type !== '' || formData.meeting_video_id !== '' || videoConference.length <= 0) {
          if (!formData.videoConference && videoConference.length > 0 && !confirm) {
            setWarningConference(true);
          } else {
            saveData()
          }
        }
      }
    }
  };

  useEffect(() => { if (confirm) { saveData(); } }, [confirm]);

  const [expire, setExpire] = useState(false);
  const saveData = () => {
    setIsLoading(true)
    createBooking(cleanFormData(formData, {
      meeting_insert_employee_id: userDatalocal.code,
      room_id: room_idx,
      meeting_department_name: userDatalocal.unitabbr
    }, userDatalocal.code))
      .then(result => {
        setAlert(true);
        setTimeout(() => {
          setIsLoading(false)
          window.location.reload();
        }, 1000)
      }).catch(error => {
        let message = 'An unexpected error occurred.';
        if (error.response) {
          setIsLoading(false)
          if (error.response.status === 401) {
            setExpire(true);
            return;
          }
          if (error.response.data) {
            message = error.response.data.message;
          }
        } else if (error.message) {
          setIsLoading(false)
          message = error.message;
        }
        setAlertRoom(true);
        setErrorMessage(message);
      });
  }

  const [room_size, setRoomSize] = useState('');
  const handleRoomClick = useCallback((roomId, roomN, warning, detail, room_size) => {
    if (previous) { setDisabled(true); } else { setDisabled(false); }
    setRoomIdx(roomId); setRoomSize(room_size);
    const date = getCurrentDate(letDate);
    const matchingRooms = events.filter((item) => item.room_id === roomId && item.date === date);
    const getDataRoom = roomArr.filter((item => item.room_id === roomId));
    setVideoConference(getDataRoom[0]?.room_conference || []);
    setRoomType(getDataRoom[0].room_type || []);
    setCatering(getDataRoom[0]?.room_catering || []);
    setUnavailable(matchingRooms); setDetail(detail);
    setRoomName(roomN); setWarning(warning); setRoomVisible(false);
    setAvailable(
      convertTimeSlotsTo24HourFormat(
        checkAvailability(
          matchingRooms, times
        )
      ));
  }, [events, letDate, roomArr, previous, newDate])

  useEffect(() => {
    if (room_idx || roomIdx > 0) {
      const date = getCurrentDate(letDate);
      setRoomIdx(roomIdx > 0 ? roomIdx : room_idx);
      const getRoom = room.filter((item) => item.room_id === room_idx || item.room_id === roomIdx);
      const warning = getRoom[0]?.room_warning || '';
      const matchingRooms = events.filter((item) => (item.room_id === room_idx || item.room_id === roomIdx) && item.date === date);
      setUnavailable(matchingRooms);
      setWarning(warning); setDisabled(false); setRoomVisible(false);
      const availableTimes = checkAvailability(matchingRooms, times);
      const convertedSlots = convertTimeSlotsTo24HourFormat(availableTimes);
      setAvailable(convertedSlots);
      setDetail(detailRoom || (getRoom?.[0]?.room_detail || null));
      if (roomNamex !== '') {
        setRoomName(getRoom[0]?.room_name || null);
        setWarning(warning || null);
        setRoomSize(getRoom[0]?.room_size || null);
        setVideoConference(getRoom[0]?.room_conference || []);
        setRoomType(getRoom[0]?.room_type || []);
        setCatering(getRoom[0]?.room_catering || []);
      }
      //check ห้องรับรองอาหาร เป็น ในห้อง
      if (room_idx === 49 || roomIdx === 49) {
        setFormData((prevData) => ({
          ...prevData,
          mealOption: updateInSide(prevData.mealOption)
        }));
      } else {
        setFormData((prevData) => ({
          ...prevData,
          mealOption: updateOutSide(prevData.mealOption)
        }));
      }
    }
  }, [room_idx, room, events, letDate, detailRoom, roomNamex, roomIdx]);

  const handleClickBack = () => { setRoomVisible(true); setDisabled(true); ClearDataInput(); }

  const handleClose = () => {
    setDisabled(true);
    setRoomVisible(true);
    setOpenForm(false);
    setLoading(true);
    setNewDate(formatNewDate(newDate));
    setTimeout(() => { setLoading(false) }, 400);
    ClearDataInput();
  };

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

  const convertDate = (formData) => {
    const isValidDate = (date) => !isNaN(new Date(date).getTime());
    const start = isValidDate(formData.date_start)
      ? new Date(formData.date_start).toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric"
        })
      : null;
    const end = isValidDate(formData.date_end)
      ? new Date(formData.date_end).toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric"
        })
      : null;
    return { start, end };
  };
  
  useEffect(() => {
    const { start, end } = convertDate(formData);
    let checkDate = start ?? dateclick;
    // Calculate the difference in days
    const distanceInDays = dayjs(checkDate).diff(dayjs(today), 'days');
    // Check if the difference is greater than or equal to -3 days
    if (distanceInDays >= 3) {
      setMoreThanThree(true);
    }
  }, [dateclick, today, formData.date_start,formData.date_end]);

  if (loading) {
    return <Loader />
  }
  //console.log({unavailable,available})
  return (
    <>
      {showAlert && openForm && (
        <AlertLocation setOpenForm={setOpenForm} />
      )}
      {expire && (<SessionExpired />)}
      <Dialog
        fullScreen
        open={open && accessForm}
        onClose={handleClose}
        TransitionComponent={Transition}
        scroll="paper"
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              จองห้องประชุมวันที่ {dateclick}
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between', // Space between text and button
                zIndex: 9999,
              }}
            >
              {/* Left Section: Text and Icon */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

              {/* Right Section: Button */}
              {!isRoomVisible && isMobile && (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={handleClickBack}
                  sx={{ marginLeft: '126px' }}
                >
                  ย้อนกลับ
                </Button>
              )}
            </Box>

          </Box>

          <Grid container spacing={3}>
            {/* Schedule Section */}
            <RoomDisplay
              room={room}
              isRoomVisible={isRoomVisible}
              locationName={locationName}
              getCurrentDate={getCurrentDate}
              newDate={dateclick}
              handleRoomClick={handleRoomClick}
              handleClickBack={handleClickBack}
              roomName={roomName}
              unavailable={unavailable}
              available={available}
              moment={moment}
              back={true}
              previous={previous}
            />
            <br />
            {/* Booking Form */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom style={{ marginBottom: '10px' }}>
                {!isRoomVisible ? (
                  <>
                    {roomName}
                    {room_size || detail ?
                      ` (${room_size ? room_size + ' คน' : ''}${room_size && detail ? ' ' : ''}${detail || ''})` : ''}
                    <br />
                    <Typography
                      component="span"
                      style={{ color: 'red', }} // Customize warning color
                    >
                      {warning}
                    </Typography>
                  </>
                ) : previous ? (
                  'ไม่สามารถจองห้องประชุมในวันเวลาที่ผ่านมาแล้วได้'
                ) :
                  (
                    'กรุณาเลือกห้อง'
                  )}
              </Typography>
              <Grid container spacing={2}>
                {/* Date Field */}
                <Typography variant="body1" color={disabled ? 'text.disabled' : 'primary'} style={{ marginTop: 8, marginLeft: '16px' }}>
                  โปรดเลือกเวลาเริ่มใช้งาน ให้ตรงตามจริง เพื่อให้ทีมบริการห้องประชุม บริการท่านได้ อย่างมีประสิทธิภาพ
                </Typography>
                {[
                  { label: "วันที่เริ่ม", type: "date", name: "date_start", value: formData.date_start, inputProps: { min: new Date().toISOString().split("T")[0] }, },
                  { label: "เวลาเริ่ม", type: "time", name: "startTime", value: formData.startTime, InputProps: { inputProps: { step: 300 }, }, required: true, },
                  { label: "วันที่สิ้นสุด", type: "date", name: "date_end", value: formData.date_end, inputProps: { min: new Date().toISOString().split("T")[0] }, },
                  { label: "เวลาสิ้นสุด", type: "time", name: "endTime", value: formData.endTime, InputProps: { inputProps: { step: 300, }, }, required: true, },
                ].map((field, index) => (
                  <Grid item xs={6} key={index}>
                    {field.type === 'time' ? (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
                        <TimePicker
                          ampm={false}
                          label={field.label}
                          disabled={disabled}
                          onChange={(newValue) => handleChange({ target: { name: field.name } }, newValue)}
                          value={field.value ? dayjs(field.value, 'HH:mm') : null}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
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
                        InputProps={field.InputProps}
                        inputProps={field.inputProps}
                        required={field.required || false}
                        disabled={disabled}
                      />
                    )}

                  </Grid>
                ))}
                <Typography
                  variant="body1"
                  color={'primary'}
                  style={{ marginTop: 8, marginLeft: '16px', marginBottom: '-12px', cursor: 'pointer' }}
                  onClick={() => { setView('day'); handleClose(); setNewDate(formatNewDate(newDate)); }}
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
                            disabled={disabled}
                          />
                        }
                        label="ใช้ Video Conference"
                      />
                      {/* Conditional Checkboxes */}
                      {formData.videoConference && videoConference.length > 0 && (
                        <FormGroup row>
                          {videoConference.map((option) => (
                            <div key={option} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name={option}
                                    checked={!!formData.selectedOptionVideo[option]}
                                    onChange={handleChange}
                                    disabled={disabled}
                                  />
                                }
                                label={option}
                              />
                            </div>
                          ))}
                        </FormGroup>
                      )}
                    </Box>
                  )}
                  {formData.videoConference && Object.keys(formData.selectedOptionVideo).length === 0 &&
                    <Typography variant="body1" color={disabled ? 'text.disabled' : 'red'} style={{ marginTop: '-5px' }}>
                      กรุณาเลือกระบบที่จะใช้งานของ Video Conferance
                    </Typography>
                  }
                  {formData.videoConference && videoConference.map((option) =>
                    formData.selectedOptionVideo[option] && (
                      <>
                        <TextField
                          focused
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
                          error={errorInput.videoNumber}
                        />
                        <Typography variant="body1" color={disabled ? 'text.disabled' : 'red'} style={{ marginTop: 0 }}>
                          กรณีต้องการใช้งาน VDO Conference จำเป็นต้องให้พนักงาน ปตท. เป็นผู้สร้าง Email นัดหมาย เนื่องจากระบบเป็น Domain ปตท. ซึ่ง Email การสร้างห้องประชุมจากบริษัทอื่นไม่สามารถเชื่อมต่อระบบ VDO Conference ได้
                        </Typography>
                      </>
                    )
                  )}
                  {!formData.videoConference && videoConference.length > 0 && (
                    <Typography variant="body1" color={disabled ? 'text.disabled' : 'red'} style={{ marginTop: 0 }}>
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
                        disabled={disabled}
                        error={errorInput.meeting_room_type}
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
                      <Typography variant="subtitle1" color={disabled ? 'text.disabled' : ''} sx={{ marginRight: 1 }}>
                        บริการอาหารเบรค
                      </Typography>
                      {!moreThanThree && !isMobile && (
                        <Typography variant="body1" color={disabled ? 'text.disabled' : 'red'}>
                          ไม่สามารถเลือกบริการอาหารได้เนื่องจากต้องจองล่วงหน้า 3 วัน
                        </Typography>
                      )}
                    </Box>
                    {isMobile && !moreThanThree && (
                      <Typography variant="body1" color={disabled ? 'text.disabled' : 'red'}>
                        ไม่สามารถเลือกบริการอาหารได้เนื่องจากต้องจองล่วงหน้า 3 วัน
                      </Typography>
                    )}
                    <FormGroup row>
                      {['morning', 'noon', 'evening'].map((meal, idx) => (
                        <FormControlLabel
                          key={idx}
                          control={
                            <Checkbox
                              name={meal}
                              checked={formData.mealService[meal]}
                              onChange={handleMealChange}
                              disabled={disabled || !moreThanThree}
                            />
                          }
                          label={meal === 'morning' ? 'เช้า' : meal === 'noon' ? 'กลางวัน' : 'บ่าย'}
                        />
                      ))}
                    </FormGroup>
                    {
                      formData.mealService.morning === false && formData.mealService.noon === false && formData.mealService.evening === false && (
                        <Typography variant="body1" color={disabled ? 'text.disabled' : 'red'}>
                          กรณีต้องการจองรับประทานอาหารกลางวัน ขอให้จอง ห้องรับรองอาหาร หรือ โถงอาคารเรียนรู้ หรือ ห้องสันทนาการ เพิ่มเติม
                        </Typography>
                      )}

                    {/* Conditionally Render TextFields and Selects Side by Side */}
                    {['morning', 'noon', 'evening'].map((meal) =>
                      formData.mealService[meal] ? (
                        <Grid key={meal} item xs={12} container spacing={1} alignItems="center" style={{ marginBottom: '12px' }}>
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
                              InputLabelProps={{ shrink: true }}
                              required
                              disabled={disabled || !moreThanThree}
                              onChange={(e) => handleMealChangeOption(meal, 'peoplenumber', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <TextField
                              size="small"
                              fullWidth
                              label={'งบต่อหัว'}
                              type="number"
                              name={meal}
                              InputLabelProps={{ shrink: true }}
                              required
                              disabled={disabled || !moreThanThree}
                              onChange={(e) => handleMealChangeOption(meal, 'perbudget', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <Select
                              name={meal}
                              disabled={disabled || moreThanThree}
                              displayEmpty
                              fullWidth
                              value={formData.mealOption[meal].outside}
                              size="small"
                              onChange={(e) => handleMealChangeOption(meal, 'outside', e.target.value)}
                            >
                              <MenuItem value="นอกห้อง">นอกห้อง</MenuItem>
                              <MenuItem value="ในห้อง">ในห้อง</MenuItem>
                            </Select>
                          </Grid>
                          {/* Select */}
                          <Grid item xs={2}>
                            <Select
                              name={meal}
                              disabled={disabled || !moreThanThree}
                              displayEmpty
                              fullWidth
                              value={formData.mealOption[meal].prepare}
                              size="small"
                              onChange={(e) => handleMealChangeOption(meal, 'prepare', e.target.value)}
                            >
                              <MenuItem value="ผู้จองเตรียมเอง">ผู้จองเตรียมเอง</MenuItem>
                              <MenuItem value="ให้ บล. เตรียม">ให้ บล. เตรียม</MenuItem>
                            </Select>
                          </Grid>
                          <Grid item xs={2}>
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
                              rows={1}
                              disabled={disabled || !moreThanThree}
                              onChange={(e) => handleMealChangeOption(meal, 'menuList', e.target.value)}
                            />
                          </Grid>
                        </Grid>
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
                      value={formData[field.name]}
                      onChange={handleChange}
                      disabled={disabled}
                      error={field.name === 'topic' ? errorInput.topic : field.name === 'peopleCount' ? errorInput.peopleCount : false}
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
                    disabled={disabled}
                  />
                </Grid>

                {/* Buttons */}
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button variant="outlined" color="warning" onClick={handleClose} >
                    ย้อนกลับ
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={disabled || isLoading}
                    onClick={handleSubmit}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} style={{ color: 'white' }} /> // Show spinner
                    ) : (
                      'บันทึก'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Dialog >
      {alertSuccess && <Snackbar text={'บันทึกรายการสำเร็จ !'} />}
      {alertRoom &&
        <AlertRoom
          open={alertRoom}
          setAlertRoom={setAlertRoom}
          textTitle={'ไม่สามารถเลือกในเวลานี้ได้'}
          textDetails={`ไม่สามารถเลือกในเวลานี้ได้ โปรดเลือกเวลาใหม่ ${minuteError ? 'การจองห้องประชุมต้องจองขั้นต่ำ 30 นาทีขึ้นไป' : ''}`}
          type={'roomTime'}
          setFormData={setFormData}
          setConfirm={setConfirm}
          openState={openState}
          setOpenState={setOpenState}
          videoConference={videoConference}
          errorMessage={errorMessage}
        />
      }
      {warningConferance &&
        <AlertRoom
          open={warningConferance}
          setAlertRoom={setWarningConference}
          textTitle={'Video Conference'}
          textDetails={'คุณไม่ได้เลือกประชุมผ่านระบบ Video Conference คุณตกลงที่จะดำเนินการต่อหรือไม่?'}
          type={'video'}
          setFormData={setFormData}
          setConfirm={setConfirm}
          openState={openState}
          setOpenState={setOpenState}
          videoConference={videoConference}
          errorMessage={errorMessage}
        />
      }

    </>
  );
}
