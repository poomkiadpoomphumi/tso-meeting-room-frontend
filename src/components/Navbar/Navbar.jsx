import * as React from 'react';
import ptt_logo from '../../images/ptt_logo.png';
import {
    AppBar, Toolbar, Box, Avatar, Skeleton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Slide,
    TextField, Alert,
    Grid, Select, InputLabel, FormControl, CircularProgress
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';
import ListAltIcon from '@mui/icons-material/ListAlt';
import Badge from '@mui/material/Badge';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Loader from '../Loader/Loader';
import { createUser, GetAllLocations } from '../../API/api';
import { SessionExpired } from '../Alert/index';
import { admin, decryptData } from '../../utils/index';
import { useMediaQuery } from '@mui/material';
import { deepOrange } from '@mui/material/colors';

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
        },
    },
    '@keyframes ripple': {
        '0%': {
            transform: 'scale(.8)',
            opacity: 1,
        },
        '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
        },
    },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const Navbar = ({ handleLogout, data, setLoading, isAdmin }) => {
    const isMobile = useMediaQuery('(max-width:600px)');
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [fullName, setFullName] = React.useState('');
    const [openState, setOpenState] = React.useState(false);
    const [code, setCode] = React.useState('');
    const [locationArr, setLocationArr] = React.useState([])
    const open = Boolean(anchorEl);
    const [expire, setExpire] = React.useState(false);
    const [alert, setAlert] = React.useState(false);
    const [textError, setTextError] = React.useState('');
    const [loadingButton, setLoadingButton] = React.useState(false);
    const [loadUndefined, setLoadUndefined] = React.useState([]);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    //function test load data use await delay(5000) params ms
    const delay = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    React.useEffect(() => {
        const processData = async () => {
            try {
                if (!data) {
                    setLoading(true);
                    return;
                }
                setLoading(true);
                //await delay(5000);
                const { iname, fname, lname, code } = data;
                setLoadUndefined({ iname, fname, lname, code });
                // Success path
                setFullName([iname, fname, lname].join(" "));
                setCode(code);
                setLoading(false);
            } catch (error) {
                console.error("Error in useEffect data name:", error);
                setLoading(true);
            }
        };
        processData();
    }, [data, setLoading]);
    //check loading form data.key is undefined
    const LoadingCheck = ['iname', 'fname', 'lname', 'code'].every(key => loadUndefined[key] === undefined)


    React.useEffect(() => {
        try {
            if (data.length <= 0) {
                setLoading(true);
            }
        } catch (error) {
            console.error("Error in useEffect check length:", error);
            setLoading(true);
        }
    }, [data, setLoading]);


    React.useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            location: isAdmin === 'superadmin' ? '1'
                : isAdmin === 'admin1' ? '1'
                    : isAdmin === 'admin2' ? '2'
                        : isAdmin === 'admin3' ? '3'
                            : isAdmin === 'admin5' ? '5'
                                : isAdmin === 'admin6' ? '6'
                                    : isAdmin === 'admin9' ? '9'
                                        : isAdmin === 'admin12' ? '12'
                                            : '1',
        }));
    }, [isAdmin]);

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
    });

    const [errors, setErrors] = React.useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.code.trim()) newErrors.code = 'รหัสพนักงาน is required';
        if (!formData.iname.trim()) newErrors.iname = 'คำนำหน้า is required';
        if (!formData.fname.trim()) newErrors.fname = 'ชื่อ is required';
        if (!formData.lname.trim()) newErrors.lname = 'นามสกุล is required';
        if (!formData.emailaddr.trim() || !/\S+@\S+\.\S+/.test(formData.emailaddr))
            newErrors.emailaddr = 'Invalid email address';
        if (!formData.mobile.trim()) newErrors.mobile = 'เบอร์โทร must be 10 digits';
        if (!formData.unitabbr.trim()) newErrors.unitabbr = 'หน่วยงาน is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    React.useEffect(() => {
        try {
            const getCodeUpdate = localStorage.getItem('userData');
            if (getCodeUpdate) {
                const decryptedData = decryptData(getCodeUpdate);
                if (decryptedData && decryptedData.code) {
                    setFormData((prev) => ({
                        ...prev,
                        createdBy: decryptedData.code,
                        updatedBy: decryptedData.code,
                    }));
                }
            }
        } catch (error) {
            console.error("Error decrypting userData:", error);
        }
    }, []);


    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            setLoadingButton(true);
            createUser(formData).then(response => {
                if (!response.data.success) {
                    setAlert(true); setTextError(response.data.message);
                    setLoadingButton(false);
                    setTimeout(() => { setAlert(false) }, 3000)
                } else {
                    setOpenState(false);
                    window.location.reload();
                }
            }).catch(error => {
                console.error('Error creating user:', error);
                if (error.response.status === 401) {
                    setExpire(true);
                    return;
                }
            });
        }
        clearErrors();
    };

    const clearErrors = () => {
        setTimeout(() => {
            setErrors({});
        }, 2000); // Clear errors after 3 seconds
    };
    React.useEffect(() => {
        const getRoomData = async () => {
            try {
                const locationData = await GetAllLocations();
                setLocationArr(locationData.data)
            } catch (err) {
                console.error(err);
            }
        };
        getRoomData();
    }, []);


    return (
        <div className="navbar-container">
            {LoadingCheck && (<Loader />)}
            {expire && (<SessionExpired />)}
            <AppBar position="static" sx={{ height: '80px', marginBottom: '10px' }}>
                <Toolbar>
                    <div className='header-container'>
                        {!isMobile && (<img src={ptt_logo} alt="ptt-logo" className='ptt-logo' />)}
                        <p style={{ fontSize: !isMobile ? '25px' : '16px', fontWeight: 'bold', color: 'white' }}>ระบบจองห้องประชุม</p>
                    </div>

                    <Box sx={{ flexGrow: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', marginRight: !isMobile ? '20px' : '-15px' }}>
                        {LoadingCheck ? (
                            <Skeleton variant="circular" width={40} height={40} sx={{ marginRight: '5px' }} />
                        ) : (
                            <StyledBadge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                variant="dot"
                            >
                                <Avatar src={`https://hq-web-s13.pttplc.com/directory/photo/${code}.jpg`} sx={{ bgcolor: deepOrange[500] }} />
                            </StyledBadge>
                        )}
                        {LoadingCheck ? (
                            <Skeleton variant="text" width={150} height={40} />
                        ) : (
                            <div>
                                <Button
                                    id="basic-button"
                                    aria-controls={open ? 'basic-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={open ? 'true' : undefined}
                                    onClick={handleClick}
                                    style={{ color: 'white' }}
                                    endIcon={<KeyboardArrowDownIcon sx={{ marginLeft: '5px' }} />}
                                >
                                    {/* {fullName} ({code}) */}
                                    {fullName}
                                </Button>
                                {isAdmin && (
                                    <>
                                        <br />
                                        <div style={{ fontSize: '14px', color: 'lightgray', marginLeft: '10px', marginTop: '-13px' }}>{isAdmin}</div>
                                    </>
                                )}
                                <Menu
                                    id="basic-menu"
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleClose}
                                    MenuListProps={{
                                        'aria-labelledby': 'basic-button',
                                    }}
                                    PaperProps={{
                                        elevation: 0,
                                        sx: {
                                            overflow: 'visible',
                                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                            mt: 1.5,
                                            '&::before': {
                                                content: '""',
                                                display: 'block',
                                                position: 'absolute',
                                                top: 0,
                                                right: 14,
                                                width: 10,
                                                height: 10,
                                                bgcolor: 'background.paper',
                                                transform: 'translateY(-50%) rotate(45deg)',
                                                zIndex: 0,
                                            },
                                            width: '200px'
                                        },
                                    }}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                >
                                    <MenuItem onClick={() => navigate('/my-booking')}><ListAltIcon sx={{ mr: '10px' }} />My Booking</MenuItem>
                                    {admin.includes(isAdmin) && (<MenuItem onClick={() => navigate('/manage-user')}>
                                        <ManageAccountsIcon sx={{ mr: '10px' }} />Manage user</MenuItem>)}
                                    {admin.includes(isAdmin) && (<MenuItem onClick={() => { setOpenState(true); handleClose() }}>
                                        <PersonAddAltIcon sx={{ mr: '10px' }} />Add user</MenuItem>)}
                                    <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: '10px' }} />Logout</MenuItem>
                                </Menu>
                            </div>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
            {/* Start Dailog Add user */}
            <Dialog
                open={openState}
                keepMounted
                TransitionComponent={Transition}
                aria-describedby="alert-dialog-slide-description"
            >

                <DialogTitle>เพิ่มข้อมูลผู้ใช้งาน</DialogTitle>
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
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    disabled={isAdmin !== 'superadmin'}
                                                >
                                                    {locationArr.map((ele) => (
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
                                                type={field.type || 'text'}
                                                value={formData[field.name]}
                                                onChange={handleChange}
                                                sx={{ marginBottom: '5px' }}
                                                error={!!errors[field.name]}
                                                helperText={errors[field.name]}
                                            />
                                        )}
                                    </Grid>
                                ))}


                            </Grid>
                        </Grid>
                        {alert && (<Alert severity="error">{textError}</Alert>)}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="error" onClick={() => setOpenState(false)}> ยกเลิก</Button>
                    <Button variant="outlined" onClick={handleSubmit}>
                        {
                            loadingButton ? (
                                <CircularProgress size={24} style={{ color: '#ddd' }} />
                            ) : (
                                'บันทึก'
                            )
                        }
                    </Button>
                </DialogActions>
            </Dialog>
            {/* End Dailog Add user */}
        </div >
    );
};

export default Navbar;
