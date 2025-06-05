import React, { useState, useEffect } from "react";
import Navbar from '../Navbar/Navbar';
import { decryptData } from '../../utils/index';
import Loader from '../Loader/Loader';
import {
    Typography, Box, TextField, InputAdornment, Slide, Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle, Grid, Select, InputLabel, FormControl, Button
} from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import SearchIcon from '@mui/icons-material/Search';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { getUserByAreaManager, GetAllLocations, updateUser, DeleteEmployeeData } from '../../API/api';
import MenuItem from '@mui/material/MenuItem';
import { useLocation } from 'react-router-dom';
import Snackbar from '../Snackbar/SnackBar';
import { DeleteEmployee, SessionExpired } from '../Alert/index'

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const columns = [
    { id: 'code', label: 'รหัสพนักงาน', minWidth: 50, align: 'left' },
    { id: 'fullname', label: 'ชื่อ นามสกุล', minWidth: 50, align: 'left' },
    { id: 'unitabbr', label: 'หน่วยงาน', minWidth: 50, align: 'left' },
    { id: 'mobile', label: 'เบอร์โทร', minWidth: 50, align: 'left' },
    { id: 'emailaddr', label: 'อีเมล', minWidth: 50, align: 'left' },
    { id: 'location', label: 'สถานที่', minWidth: 50, align: 'left' }
];

const ManageUser = ({ handleLogout }) => {
    const locationPath = useLocation();
    const [isAdmin, setIsAdmin] = useState('');
    const [userData, setUserData] = useState([]);
    const data = localStorage.getItem('userData');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [rows, setRows] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [locationArr, setLocationArr] = useState([]);
    const [openSuccess, setOpenSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [filteredRows, setFilteredRows] = useState([]);
    const handleChangePage = (event, newPage) => { setPage(newPage); };
    const [expire, setExpire] = useState(false);

    useEffect(() => {
        if (data) {
            const userDatalocal = decryptData(data);
            setIsAdmin(userDatalocal.isAdmin);
            setUserData(userDatalocal);
            setLoading(false)
        }
    }, [data]);

    useEffect(() => {
        if (isAdmin) {

            const getData = async () => {
                try {
                    const response = await getUserByAreaManager(isAdmin);
                    const locationData = await GetAllLocations();
                    // Create a lookup map for locationData
                    const filteredLocationsIds = (id) => {
                        const filteredLocations = locationData.data.filter((loc) => loc.location_id === id);
                        const locationNames = filteredLocations.map((loc) => loc.location_name);
                        return locationNames[0];
                    }
                    if (locationData.data.length > 0 && response.data.length > 0) {
                        setLocationArr(locationData.data)
                        const updatedData = response.data
                            .filter(({ disable }) => !disable) // Filter items where disable is false
                            .map(({ code,
                                location,
                                emailaddr,
                                mobile,
                                unitabbr, 
                                fname, 
                                lname, 
                                iname,
                                createdBy,
                                updatedBy, 
                                disable }) => ({
                                    code,
                                    location: filteredLocationsIds(location),
                                    emailaddr,
                                    mobile: mobile || 'Unkown',
                                    unitabbr: unitabbr || 'Unkown',
                                    fullname: `${fname} ${lname}`,
                                    iname,
                                    createdBy,
                                    updatedBy,
                                    disable
                                }));
                        setRows(updatedData);
                        setFilteredRows(updatedData);
                        setLoading(false);
                    }
                } catch (error) {
                    if (error.response?.status === 401) {
                        setExpire(true);

                    } else {
                        console.error("An error occurred:", error);
                    }
                }
            }
            getData();
        }
    }, [isAdmin])

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };
    const [formData, setFormData] = React.useState({
        code: '',
        iname: '',
        fname: '',
        lname: '',
        emailaddr: '',
        mobile: '',
        unitabbr: '',
        location: '',
        createdBy: '',
        updatedBy: '',
        disable: false,
    });

    useEffect(() => {
        const getCodeUpdate = localStorage.getItem('userData');
        const decryptedData = decryptData(getCodeUpdate);
        // Update the formData state with the decrypted code
        setFormData((prev) => ({
            ...prev,
            updatedBy: decryptedData.code,
        }));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleClick = (row) => {
        const filteredLocations = locationArr.filter((loc) => loc.location_name === row.location);
        const locationId = filteredLocations.map((loc) => loc.location_id);
        const spiltName = row.fullname.split(' ')
        setFormData((prev) => ({
            ...prev,
            code: row.code,
            iname: row.iname === 'Unkown' ? '' : row.iname || '',
            fname: row.fname === 'Unkown' ? '' : spiltName[0] || '',
            lname: row.lname === 'Unkown' ? '' : spiltName[1] || '',
            emailaddr: row.emailaddr === 'Unkown' ? '' : row.emailaddr || '',
            mobile: row.mobile === 'Unkown' ? '' : row.mobile || '',
            unitabbr: row.unitabbr === 'Unkown' ? '' : row.unitabbr || '',
            location: locationId[0] || '',
            createdBy: row.createdBy || '',
            disable: row.disable
        }));
        setOpenDialog(true)
    }

    const success = () => {
        localStorage.setItem('saveUser', 'true');
        localStorage.setItem('path', locationPath.pathname);
        window.location.reload();
    }

    const handleClickSave = async () => {
        try {
            const result = await updateUser(formData.code, formData);
            if (result.status === 200) { success(); }
        } catch (error) {
            if (error.response?.status === 401) {
                setExpire(true);
            } else {
                console.error("An error occurred:", error);
            }
        }
    };


    const handleDelete = async () => {
        try {
            const id = formData.code;
            const response = await DeleteEmployeeData(id);
            if (response.status === 200) { success(); }
        } catch (error) {
            if (error.response?.status === 401) {
                setExpire(true);
                setConfirmDelete(false);
            } else {
                console.error("An error occurred:", error);
            }
        }
    };


    const getSave = localStorage.getItem('saveUser');
    useEffect(() => {
        if (getSave === 'true') {
            setOpenSuccess(true);
            localStorage.removeItem("saveUser")
        }
    }, [getSave]);


    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchTerm(query);
        const filtered = rows.filter(
            (row) =>
                row.code.toLowerCase().includes(query) ||
                row.fullname.toLowerCase().includes(query) ||
                row.unitabbr.toLowerCase().includes(query) ||
                row.mobile.toLowerCase().includes(query) ||
                row.emailaddr.toLowerCase().includes(query) ||
                row.location.toLowerCase().includes(query)
        );
        setFilteredRows(filtered);
    };

    if (loading) {
        return <Loader />
    }

    return (
        <>
            {expire && (<SessionExpired />)}
            {openSuccess && (<Snackbar text={'บันทึกรายการสำเร็จ !'} />)}
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
                        <Typography variant="h5">รายชื่อผู้ใช้งานระบบจองห้องประชุม</Typography>
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
                                                bgcolor: '#5286cd',
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
                                {filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                                    <TableRow hover role="checkbox" tabIndex={-1} key={row.code} sx={{ cursor: 'pointer' }}
                                        onClick={() => handleClick(row)}
                                    >
                                        {columns.map((column) => {
                                            const value = row[column.id];
                                            if (column.id === 'fullname') {
                                                return ( // Add a return statement here
                                                    <TableCell key={column.id}>
                                                        {row.iname}{value}
                                                    </TableCell>
                                                );
                                            } else {
                                                return ( // Add a return statement here
                                                    <TableCell key={column.id}>
                                                        {value}
                                                    </TableCell>
                                                );
                                            }

                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>

                        </Table>
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


                <Dialog
                    open={openDialog}
                    TransitionComponent={Transition}
                    aria-describedby="alert-dialog-slide-description"
                >

                    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ marginBottom: '-20px' }}>
                        <DialogTitle >แก้ไขข้อมูลผู้ใช้งาน</DialogTitle>
                        <Button color="error" onClick={() => setConfirmDelete(true)} sx={{ marginRight: '14px' }}>
                            ลบผู้ใช้งาน
                        </Button>
                    </Box>
                    <DialogContent sx={{ width: '500px' }}>
                        <DialogContentText id="alert-dialog-slide-description">
                            <Grid item xs={12} md={6} sx={{ marginBottom: '5px' }}>

                                <Grid container spacing={1}>
                                    {[
                                        { size: 'small', name: 'location', label: 'สถานที่', type: 'text' },
                                        { size: 'small', name: 'code', label: 'รหัสพนักงาน', type: 'text' },
                                        { size: 'small', name: 'iname', label: 'คำนำหน้า', type: 'text' },
                                        { size: 'small', name: 'fname', label: 'ชื่อ', type: 'text' },
                                        { size: 'small', name: 'lname', label: 'นามสกุล', type: 'text' },
                                        { size: 'small', name: 'emailaddr', label: 'อีเมล', type: 'email' },
                                        { size: 'small', name: 'mobile', label: 'เบอร์โทร', type: 'tel' },
                                        { size: 'small', name: 'unitabbr', label: 'หน่วยงาน', type: 'text' },
                                    ].map((field, index) => (
                                        <Grid
                                            item
                                            xs={
                                                field.name === 'iname' ||
                                                    field.name === 'fname' ||
                                                    field.name === 'lname'
                                                    ? 4 :
                                                    field.name === 'mobile' ||
                                                        field.name === 'unitabbr'
                                                        ? 6 : 12
                                            }
                                            key={index}
                                        >
                                            {field.name === 'location' ? (
                                                <FormControl fullWidth>
                                                    <Select
                                                        size="small"
                                                        name="location"
                                                        onChange={handleChange}
                                                        value={formData.location}
                                                        disabled={isAdmin !== 'superadmin'}
                                                    >
                                                        {locationArr?.map((ele) => (
                                                            <MenuItem key={ele.location_id} value={ele.location_id}>
                                                                {ele.location_name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            ) : field.name === 'iname' ? (
                                                <FormControl fullWidth >
                                                    <InputLabel id="select-iname" sx={{ top: '-8px' }}> {field.label} </InputLabel>
                                                    <Select
                                                        labelId="select-iname"
                                                        fullWidth
                                                        label={field.label}
                                                        name={field.name}
                                                        size={field.size}
                                                        value={formData[field.name]}
                                                        onChange={handleChange}
                                                    >
                                                        <MenuItem value="นาย">นาย</MenuItem>
                                                        <MenuItem value="นาง">นาง</MenuItem>
                                                        <MenuItem value="นางสาว">นางสาว</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                <TextField
                                                    fullWidth
                                                    size={field.size}
                                                    name={field.name}
                                                    label={field.label}
                                                    value={formData[field.name]}
                                                    type={field.type || 'text'}
                                                    onChange={handleChange}
                                                    sx={{ marginBottom: '5px' }}
                                                />
                                            )}
                                        </Grid>
                                    ))}


                                </Grid>
                            </Grid>

                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button color="error" onClick={() => setOpenDialog(false)}> ยกเลิก</Button>
                        <Button onClick={handleClickSave}>บันทึก</Button>
                    </DialogActions>
                </Dialog>
                <DeleteEmployee confirmDelete={confirmDelete} formData={formData} handleDelete={handleDelete} setConfirmDelete={setConfirmDelete} />
            </div>
        </>
    );
}

export default ManageUser;