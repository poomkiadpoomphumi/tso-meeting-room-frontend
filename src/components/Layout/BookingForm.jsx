import moment from 'moment';
import React, { useEffect, useState, useCallback } from 'react';
import {
    Button,
    Grid,
    Box,
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
    Divider
} from '@mui/material';
import { useParams } from 'react-router-dom';
import '../../css/BookingFormPage.css';
import RoomDisplay from './roomDisplay';
import { GetRoomByLocation, getBookingByIdDisplay, GetAllBookings } from '../../API/api';
import { times } from '../times';
import { convertTimeSlotsTo24HourFormat, checkAvailability } from '../CalendarUtils';
import Loader from '../Loader/Loader';
import { decodeHtmlEntities, getMealDetails } from '../../utils/index';

import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers'
const locale = 'en-gb';

const BookingForm = () => {
    const { id, location } = useParams();
    const [room, setRoom] = useState([]);
    const [unavailable, setUnavailable] = useState([]);
    const [available, setAvailable] = useState([]);
    const login = () => { window.open('/', '_blank'); }
    const getCurrentDate = (customDate) => customDate || moment().format('YYYY-MM-DD');
    const [loading, setLoading] = useState(true);
    const [openData, setOpenData] = useState(false);
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
        contactNumber: '',
        topic: '',
        details: '',
        meeting_video_id: '',
        room_name: ''
    });

    const extractYearMonth = (dateString) => {
        const date = new Date(dateString);
        const year = date.getUTCFullYear(); // Get the year
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Get the month and pad with '0'
        return `${year}-${month}`;
    };

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                setLoading(true);
                if (location && id) {
                    const bookingsData = await getBookingByIdDisplay(id);
                    const yearMonth = extractYearMonth(bookingsData.data[0].meeting_datetime_start);
                    const events = await GetAllBookings(yearMonth);
                    if (events) {
                        const roomData = await GetRoomByLocation(location);
                        setRoom(roomData.data);
                        setOpenData(true);
                        const matchingRoom = events.data.find(
                            (item) =>
                                item.room_id === bookingsData.data[0].room_id &&
                                item.meeting_datetime_start === bookingsData.data[0].meeting_datetime_start
                        );
                        setUnavailable(matchingRoom ? [matchingRoom] : []);
                        const availableTimes = checkAvailability(matchingRoom ? [matchingRoom] : [], times);
                        const convertedSlots = convertTimeSlotsTo24HourFormat(availableTimes);
                        setAvailable(convertedSlots);
                    }
                }
            } catch (e) {
                console.error(e);
                setOpenData(false);
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [location, id]);

    const [videoConference, setVideoConference] = useState([]);
    useEffect(() => {
        setLoading(true);
        if (unavailable && unavailable.length > 0) {
            setLoading(false);
            const mealServiceData = decodeHtmlEntities(unavailable[0].meeting_catering_detail);
            const morningDetails = getMealDetails('morning', mealServiceData);
            const noonDetails = getMealDetails('lunch', mealServiceData);
            const eveningDetails = getMealDetails('afternoon', mealServiceData);
            const conferenceDetail = unavailable[0].meeting_conference_detail || "";
            const Microsoft = conferenceDetail.match(/Microsoft Teams/i) ? true : false;
            const CiscoWebex = conferenceDetail.match(/Cisco webex/i) ? true : false;
            setVideoConference(unavailable[0].room_conference)
            setFormData((prev) => ({
                ...prev,
                date_start: unavailable[0].fix_date_start,
                date_end: unavailable[0].fix_date_end,
                startTime: unavailable[0].startTime,
                endTime: unavailable[0].endTime,
                peopleCount: unavailable[0].meeting_participant_count,
                bookerName: unavailable[0].meeting_reserver_name,
                contactNumber: unavailable[0].meeting_reserver_phone,
                topic: unavailable[0].description,
                details: unavailable[0].meeting_description,
                meeting_room_type: unavailable[0].meeting_room_type,
                meeting_video_id: unavailable[0].meeting_video_id,
                videoConference: conferenceDetail !== '' ? true : false,
                selectedOptionVideo: { 'Microsoft Teams': Microsoft, 'Cisco webex': CiscoWebex },
                mealService: {
                    morning: morningDetails.check,
                    noon: noonDetails.check,
                    evening: eveningDetails.check,
                },
                mealOption: {
                    morning: {
                        menuList: morningDetails.menuList || 'ไม่ระบุ',
                        time: morningDetails.time,
                        peoplenumber: morningDetails.peoplenumber,
                        perbudget: morningDetails.perbudget,
                        outside: morningDetails.outside,
                        prepare: morningDetails.prepare
                    },
                    noon: {
                        menuList: noonDetails.menuList || 'ไม่ระบุ',
                        time: noonDetails.time,
                        peoplenumber: noonDetails.peoplenumber,
                        perbudget: noonDetails.perbudget,
                        outside: noonDetails.outside,
                        prepare: noonDetails.prepare
                    },
                    evening: {
                        menuList: eveningDetails.menuList || 'ไม่ระบุ',
                        time: eveningDetails.time,
                        peoplenumber: eveningDetails.peoplenumber,
                        perbudget: eveningDetails.perbudget,
                        outside: eveningDetails.outside,
                        prepare: eveningDetails.prepare
                    },
                },
            }));
        }
    }, [unavailable]);

    if (loading) {
        return <Loader />
    }
    return (
        <>
            {openData ? (
                <Dialog
                    fullScreen
                    open={true}
                    scroll="paper"
                >
                    <AppBar sx={{ position: 'relative' }}>
                        <Toolbar>
                            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                {`แบบฟอร์มการจองห้องประชุม ${unavailable && unavailable.length > 0 && unavailable[0].title} วันที่ ${unavailable && unavailable.length > 0 && unavailable[0].date}`}
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
                            <Box sx={{ display: 'flex', alignItems: 'center' }} >
                                <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{ cursor: 'pointer' }}
                                    color={'primary'}
                                >
                                    <a onClick={login}>คุณยังไม่ได้เข้าสู่ระบบ โปรดเข้าสู่ระบบเพื่อใช้งาน</a>
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={login}
                            >
                                เข้าสู่ระบบ
                            </Button>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Schedule Section */}
                            <RoomDisplay
                                room={room}
                                isRoomVisible={false}
                                getCurrentDate={getCurrentDate}
                                newDate={unavailable && unavailable.length > 0 && unavailable[0]?.date}
                                roomName={unavailable && unavailable.length > 0 && unavailable[0]?.title}
                                unavailable={unavailable}
                                available={available}
                                moment={moment}
                                back={false}
                            />
                            <br />
                            {/* Booking Form */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom style={{ marginBottom: '10px' }}>
                                    {unavailable && unavailable.length > 0 && unavailable[0].title}
                                    {unavailable?.[0]?.room_detail && ` (${unavailable[0].room_detail})`}
                                </Typography>
                                <Grid container spacing={2}>
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
                                                        disabled={true}
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
                                                    InputLabelProps={{ shrink: true }}
                                                    InputProps={{ readOnly: true }}
                                                />
                                            )}
                                        </Grid>
                                    ))}
                                    <Typography
                                        variant="body1"
                                        color={'primary'}
                                        style={{ marginTop: 8, marginLeft: '16px', marginBottom: '-12px', cursor: 'pointer' }}
                                        onClick={login}
                                    >
                                        ดูตารางการจองแยกตามห้องประชุม
                                    </Typography>
                                    {/* Video Conference */}
                                    <Grid item xs={12}>
                                        {formData.videoConference && (
                                            <Box display="flex" alignItems="flex-start" gap={2} sx={{ marginBottom: '10px' }}>
                                                {/* Main Checkbox */}
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            name="videoConference"
                                                            checked={formData.videoConference}
                                                        />
                                                    }
                                                    label="ใช้ Video Conference"
                                                />
                                                {/* Conditional Checkboxes */}
                                                <FormGroup row>
                                                    {videoConference.map((option) => (
                                                        <FormControlLabel
                                                            key={option}
                                                            control={
                                                                <Checkbox
                                                                    name={option}
                                                                    checked={!!formData.selectedOptionVideo[option]}
                                                                />
                                                            }
                                                            label={option}
                                                        />
                                                    ))}
                                                </FormGroup>
                                            </Box>
                                        )}
                                        {formData.videoConference && videoConference.map((option) =>
                                            formData.selectedOptionVideo[option] && (
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    label={`หมายเลข video id ของ ${option}`}
                                                    style={{ marginBottom: '12px' }}
                                                    required
                                                    value={formData.meeting_video_id || ''}
                                                    InputProps={{ readOnly: true }}
                                                />
                                            )
                                        )}
                                        {formData.meeting_room_type !== '' && (
                                            <TextField
                                                fullWidth
                                                labelId="select-roomType"
                                                size="small"
                                                value={formData.meeting_room_type}
                                                name="meeting_room_type"
                                                label="รูปแบบห้อง"
                                                InputProps={{ readOnly: true }}
                                            />
                                        )}


                                    </Grid>

                                    {/* Meal Services */}
                                    {/* {catering > 0 && ( */}
                                    <Grid item xs={12}>
                                        <Box display="flex" alignItems="center">
                                            <Typography variant="subtitle1" sx={{ marginRight: 1 }}>
                                                บริการอาหารเบรค
                                            </Typography>
                                        </Box>

                                        <FormGroup row sx={{ marginBottom: '-10px' }}>
                                            {['morning', 'noon', 'evening'].map((meal, idx) => (
                                                <FormControlLabel
                                                    key={idx}
                                                    control={
                                                        <Checkbox
                                                            name={meal}
                                                            checked={formData.mealService[meal]}
                                                        />
                                                    }
                                                    label={meal === 'morning' ? 'เช้า' : meal === 'noon' ? 'กลางวัน' : 'บ่าย'}
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
                                                                value={formData.mealOption[meal]?.peoplenumber || ''}
                                                                InputLabelProps={{ shrink: true }}
                                                                InputProps={{ readOnly: true }}
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
                                                                InputProps={{ readOnly: true }}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={2}>
                                                            <Select
                                                                name={meal}
                                                                fullWidth
                                                                value={formData.mealOption[meal].outside || ''}
                                                                size="small"
                                                                InputProps={{ readOnly: true }}
                                                            >
                                                                <MenuItem value="นอกห้อง">นอกห้อง</MenuItem>
                                                                <MenuItem value="ในห้อง">ในห้อง</MenuItem>
                                                            </Select>
                                                        </Grid>
                                                        {/* Select */}
                                                        <Grid item xs={3}>
                                                            <Select
                                                                name={meal}
                                                                displayEmpty
                                                                fullWidth
                                                                value={formData.mealOption[meal].prepare || ''}
                                                                size="small"
                                                                InputProps={{ readOnly: true }}
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
                                                                InputProps={{ readOnly: true }}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                    <Divider />
                                                </>
                                            ) : null
                                        )}
                                    </Grid>
                                    {/* )} */}
                                    {/* Other Fields */}
                                    {[
                                        { name: 'peopleCount', label: 'จำนวนคน', type: 'number' },
                                        { name: 'bookerName', label: 'ผู้จอง', type: 'text' },
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
                                                InputProps={{ readOnly: true }}
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
                                            InputProps={{ readOnly: true }}
                                            multiline
                                            rows={5}
                                        />
                                    </Grid>

                                    {/* Buttons */}
                                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <Button size="small" variant="contained" color="primary" onClick={login}>
                                            เข้าสู่ระบบ
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </Dialog >
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        textAlign: 'center',
                    }}
                >
                    <Typography>
                        No data available or data is deleted.
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={login}
                        style={{ marginTop: '20px' }} // Add some space between the text and the button
                    >
                        เข้าสู่ระบบ
                    </Button>
                </div>

            )}

        </>
    )
}
export default BookingForm;