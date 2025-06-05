import React, { useState, useEffect } from 'react';
import Loader from '../Loader/Loader';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Navbar from '../Navbar/Navbar';
import { Typography, Box, TextField, InputAdornment, Button } from '@mui/material';
import { MyBookingAll, GetRoomByLocation, getAllRoomsData } from '../../API/api';
import { decryptData } from '../../utils/index';
import SearchIcon from '@mui/icons-material/Search';
import { normalizeDateTime, toThaiTime } from '../CalendarUtils';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import DialogFormEdit from './DialogFormEdit';
import EditIcon from '@mui/icons-material/Edit';
import { Link } from 'react-router-dom';
import Snackbar from '../Snackbar/SnackBar';
import moment from 'moment';
import { SessionExpired } from '../Alert/index';

const columns = [
    { id: 'fix_date_start_text', label: 'เวลาเริ่ม', minWidth: 50, align: 'center' },
    { id: 'fix_date_end_text', label: 'เวลาสิ้นสุด', minWidth: 50, align: 'center' },
    { id: 'description', label: 'หัวข้อ', minWidth: 100, align: 'left' },
    { id: 'title', label: 'ห้องประชุม', minWidth: 50, align: 'left' },
    { id: 'meeting_participant_count', label: 'จำนวนคน', minWidth: 50, align: 'center' },
    { id: 'meeting_department_name', label: 'หน่วยงาน', minWidth: 50, align: 'center' },
    { id: 'meeting_reserver_name', label: 'ผู้จอง', minWidth: 50, align: 'center' },
    { id: 'action', label: '', minWidth: 50, align: 'center' },
    { id: 'location_name' }
];

const MyBooking = ({ handleLogout }) => {
    const [view, setView] = useState("month");
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [userData, setUserData] = useState([]);
    const [rows, setRows] = useState([]);
    const data = localStorage.getItem('userData');
    const [title, setTitle] = useState('');
    const [room_id, setRoomId] = useState(0);
    const [locationName, setLocationName] = useState('ศูนย์ปฏิบัติการระบบท่อ ชลบุรี');
    const [location, setLocation] = useState('');
    const [detailRoom, setDetailRoom] = useState('');
    const [date, setDate] = useState('');
    const [events, setEvents] = useState([]);
    const alert = localStorage.getItem('alert');
    const save = localStorage.getItem('save');
    const [alertSuccess, setAlert] = useState(false);
    const [saveSuccess, setSave] = useState(false);
    const [filteredRows, setFilteredRows] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdmin, setIsAdmin] = useState('');
    const [expire, setExpire] = useState(false);
    const [roomArr, setRoomArr] = useState([]);
    const [arrayRoom, setArrayRoom] = useState([{}]);

    const handleEditClick = (roomArray) => {
        setTitle(roomArray.title);
        setRoomId(roomArray.room_id);
        setLocationName(roomArray.location_name)
        setLocation(roomArray.location_id);
        setDetailRoom(roomArray.room_detail);
        setDate(roomArray.date);
        setEvents(roomArray);
        // Perform actions with roomArray
        setArrayRoom([roomArray]); // Example: log the room array
        // You can also update state or open a dialog/modal with the room data
        setOpenEdit(true);
    };

    useEffect(() => {
        setLoading(true);
        try {
            if (data || openEdit) {
                const fecthDataBooking = async () => {
                    const allRooms = await getAllRoomsData();
                    const roomLocation = allRooms.data.find((room) => room.room_id === room_id);
                    const roomData = await GetRoomByLocation(roomLocation?.location_id);
                    setRoomArr(roomData.data);
                    const userDatalocal = decryptData(data);
                    setIsAdmin(userDatalocal.isAdmin);
                    setUserData(userDatalocal);
                    try {
                        const [bookingResponse] = await Promise.all([MyBookingAll(userDatalocal.code)]);
                        //const meetingIdsToFilter = [42780];
                        const bookings = bookingResponse.data || [];
                        const processedData = bookings
                            .filter((item) => item.room_id > 0
                                //&& meetingIdsToFilter.includes(item.meeting_id)
                            ).reduce((result, item) => {
                                const fixDateStart = normalizeDateTime(`${item.date} ${item.startTime}`);
                                const fixDateEnd = normalizeDateTime(`${item.date_end} ${item.endTime}`);
                                // If the meeting_id is already in the result, update its arrays
                                const existing = result.find(r => r.meeting_id === item.meeting_id);

                                if (existing) {
                                    existing.fix_date_start_texts.push(toThaiTime(...fixDateStart.split(" ")));
                                    existing.fix_date_end_texts.push(toThaiTime(...fixDateEnd.split(" ")));
                                } else {
                                    // If not, create a new entry
                                    result.push({
                                        ...item,
                                        fix_date_start_texts: [toThaiTime(...fixDateStart.split(" "))],
                                        fix_date_end_texts: [toThaiTime(...fixDateEnd.split(" "))],
                                        title: item.title,
                                    });
                                }
                                return result;
                            }, [])
                            .map(item => ({
                                ...item,
                                fix_date_start_text: item.fix_date_start_texts[0], // First index
                                fix_date_end_text: item.fix_date_end_texts[item.fix_date_end_texts.length - 1], // Last index
                            }))
                            .sort((a, b) => new Date(b.meeting_update_timestamp) - new Date(a.meeting_update_timestamp));

                        setRows(processedData);
                        setFilteredRows(processedData);
                        setLoading(false);
                    } catch (error) {
                        if (error.response?.status === 401) {
                            setLoading(false);
                            setExpire(true);
                        } else {
                            console.error("An error occurred:", error);
                        }
                    }

                }
                fecthDataBooking();
            } else {
                console.log('No user data found in localStorage.');
            }
            if (alert === 'true') {
                setAlert(true);
                setTimeout(() => {
                    setAlert(false);
                    localStorage.removeItem("alert");
                }, 1000);
            }
            if (save === 'true') {
                setSave(true);
                setTimeout(() => {
                    setSave(false);
                    localStorage.removeItem("save");
                    window.location.reload();
                }, 1000);
            }
        } catch (e) {
            console.error(e)
        }
    }, [data, alert, openEdit, room_id])

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchTerm(query);

        const filtered = rows.filter(
            (row) =>
                row.fix_date_start_text.toLowerCase().includes(query) ||
                row.fix_date_end_text.toLowerCase().includes(query) ||
                row.description.toLowerCase().includes(query) ||
                row.title.toLowerCase().includes(query) ||
                row.meeting_department_name.toLowerCase().includes(query) ||
                row.meeting_reserver_name.toLowerCase().includes(query)
        );
        setFilteredRows(filtered);
    };

    // Function to determine background color
    const checkTimerole = (row) => {
        const meetingUpdateDate = moment(row.date_end.split('T')[0]);
        const meetingStartDate = moment(row.date);
        const isCurrentDate = meetingUpdateDate.isSame(moment(), 'day');
        const hasPastDate = meetingStartDate.isBefore(moment(), 'day');
        return isCurrentDate || !hasPastDate ? '#fff' : '#ededed';
    };

    // Sort rows to bring those with '#fff' to the top
    const sortedRows = [...filteredRows].sort((a, b) => {
        const colorA = checkTimerole(a);
        const colorB = checkTimerole(b);

        if (colorA === '#fff' && colorB !== '#fff') return -1;
        if (colorB === '#fff' && colorA !== '#fff') return 1;

        return filteredRows.indexOf(a) - filteredRows.indexOf(b); // Preserve original order
    });

    if (loading) {
        return <Loader />
    }
    return (
        <>
            {alertSuccess && <Snackbar text={'ลบรายการสำเร็จ !'} />}
            {saveSuccess && <Snackbar text={'บันทึกรายการสำเร็จ !'} />}
            {expire && (<SessionExpired />)}
            <Navbar handleLogout={handleLogout} data={userData} setLoading={setLoading} isAdmin={isAdmin} sx={{ marginBottom: '20px' }} />
            <div style={{ padding: '20px', borderRadius: '5px', height: '100%' }}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ marginBottom: '20px' }}
                >
                    {/* Typography with Icon */}
                    <Box display="flex" alignItems="center" gap={1}>
                        <Link to="/calendar" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <ArrowBackIosIcon sx={{ cursor: 'pointer' }} />
                        </Link>
                        <Typography variant="h5">รายการจองห้องประชุม</Typography>
                    </Box>

                    {/* Search TextField */}
                    <TextField
                        variant="outlined"
                        placeholder="Search"
                        size="small"
                        sx={{ maxWidth: '300px', marginBottom: '16px' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </Box>

                <Paper sx={{ width: '100%', height: '100%' }}>
                    <TableContainer
                        sx={{
                            height: '100%',
                            borderRadius: '5px',
                            overflow: 'hidden',
                        }}
                    >
                        <Table stickyHeader aria-label="sticky table" sx={{ height: '100%' }}>
                            <TableHead>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.id}
                                            align={column.align}
                                            style={{ minWidth: column.minWidth }}
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'common.white',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {column.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedRows
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((row, index) => {
                                        return (
                                            <TableRow hover role="checkbox" tabIndex={-1} key={row.meeting_id}
                                                sx={{
                                                    cursor: 'pointer',
                                                    bgcolor: checkTimerole(row)
                                                }}
                                                onClick={() => handleEditClick(row)}>
                                                {columns.map((column) => {
                                                    const value = row[column.id];
                                                    if (column.id === 'action') {
                                                        return (
                                                            <TableCell key={column.meeting_id} align={column.align} >
                                                                <Button
                                                                    startIcon={<EditIcon />}
                                                                    size="small"
                                                                    color="warning"
                                                                    onClick={() => handleEditClick(row)}
                                                                >
                                                                    แก้ไข
                                                                </Button>
                                                            </TableCell>
                                                        );
                                                    }
                                                    return (
                                                        <TableCell key={column.meeting_id} align={column.align}>
                                                            {value}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                        {filteredRows.length <= 0 && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", padding: '20px' }}>
                                <span>ไม่มีข้อมูลการจองห้องประชุม</span>
                            </div>
                        )}
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 100]}
                        component="div"
                        count={rows.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            </div>
            <DialogFormEdit
                openForm={openEdit}
                setOpenForm={setOpenEdit}
                newDate={''}
                location={location}
                locationName={locationName}
                events={events}
                roomIdx={room_id}
                roomNamex={title}
                detailRoom={detailRoom}
                setView={setView}
                setModalIsOpen={setModalIsOpen}
                date_edit={date}
                arrayRoom={arrayRoom}
                roomArr={roomArr}
            />
        </>

    );
}
export default MyBooking;