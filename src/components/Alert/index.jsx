import React, { useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Alert,
    Slide,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { getBookingById, softDelete } from '../../API/api';
import { decryptData } from '../../utils/index';
import CircularProgress from '@mui/material/CircularProgress';
import { useMsal } from '@azure/msal-react';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const AlertRoom = ({ open, setAlertRoom, textTitle, textDetails, type, setConfirm, setFormData, openState, setOpenState, videoConference, errorMessage }) => {
    const handleClickConfirm = () => {
        setAlertRoom(false);
        if (type === 'video') {
            setConfirm(true);
        }
    };
    const handleClickCancel = () => {
        if (type === 'video') {
            setOpenState(true); // Update openState to true when 'video' type
        } else {
            setAlertRoom(false);
        }
    };
    const handleCloseOpenState = () => {
        setOpenState(false); // Add a handler to close the second dialog
        setTimeout(() => {
            setAlertRoom(false);
            setFormData(prevState => ({
                ...prevState,
                videoConference: true, // Update videoConference to true
                selectedOptionVideo: { [videoConference[0]]: true }
            }));
        }, 300)
    };
    return (
        <>
            <Dialog
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
                open={open}
                TransitionComponent={Transition}
                keepMounted
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>{textTitle}</DialogTitle>
                <DialogContent sx={{ width: '450px' }}>
                    <DialogContentText id="alert-dialog-slide-description">
                        <Alert severity="error">{textDetails}<br />{errorMessage ? errorMessage : null}</Alert>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button color="error" onClick={handleClickCancel}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleClickConfirm}>ตกลง</Button>
                </DialogActions>
            </Dialog>

            {/* Second Dialog */}
            <Dialog
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
                open={openState}
                TransitionComponent={Transition}
                keepMounted
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>กรุณาเลือกระบบที่จะใช้งานของ Video Conferance</DialogTitle>
                <DialogContent sx={{ width: '450px' }}>
                    <DialogContentText id="alert-dialog-slide-description">
                        <Alert severity="warning">กรุณาเลือกระบบที่จะใช้งานของ Video Conferance</Alert>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseOpenState}>ตกลง</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};


export const ModalCancle = ({ room_id, meeting_id, openConfirm, setOpenConfirm, title, dateStart, dateEnd, setModalIsOpen }) => {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const userData = localStorage.getItem('userData');
    const userDatalocal = decryptData(userData);
    const [expire, setExpire] = useState(false);
    const handleConfirm = () => {
        setLoading(true);
        try {
            localStorage.setItem('alert', 'true');
            const delete_item = async (meeting_id, isAdmin) => {
                try {
                    const bookingsResult = await getBookingById(meeting_id);
                    if (bookingsResult.data && bookingsResult.data.length > 0) {
                        const bookings = {
                            ...bookingsResult.data[0],
                            room_name: title //Map room name to array
                        }
                        let code_tmp = userDatalocal.code.toLowerCase();
                        const delete_meeting = await softDelete(meeting_id, isAdmin, bookings, code_tmp, 'del');
                            if (delete_meeting.status === 200) {
                                setOpenConfirm(false);
                                setModalIsOpen(false);
                                if (location.pathname !== '/calendar') {
                                    localStorage.setItem('reload', 'true');
                                    window.location.reload();
                                }
                            } else {
                                console.error('Response Error')
                            }
                    } else {
                        console.error('No bookings found for deletion');
                    }
                } catch (error) {
                    console.error('Error in delete_item:', error);
                    if (error.response.status === 401) {
                        setExpire(true);
                    }
                }
            };
            delete_item(meeting_id, userDatalocal.isAdmin);
            setOpenConfirm(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (expire) return <SessionExpired />;

    return (
        <Dialog
            sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
            open={openConfirm}
            TransitionComponent={Transition}
            keepMounted
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle>{"คุณแน่ใจหรือไม่ว่าจะยกเลิกการจองห้องประชุม?"}</DialogTitle>
            <DialogContent sx={{ width: '450px' }}>
                <DialogContentText id="alert-dialog-slide-description">
                    <Alert severity="error">
                        คุณแน่ใจหรือไม่ว่าจะยกเลิกการจองห้องประชุม {title && `"${title}"`} <br />
                        {title && `วันที่ ${dateStart} - ${dateEnd}`}
                    </Alert>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button color='error' onClick={() => setOpenConfirm(false)}>ยกเลิก</Button>
                <Button
                    color="primary"
                    onClick={handleConfirm}
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {loading ? "" : "ตกลง"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};


export const AlertLocation = ({ setOpenForm }) => {
    const [open, setOpen] = useState(true);
    const handleClick = () => { setOpen(false); setOpenForm(false); }
    return (
        <>
            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>ไม่สามารถจองห้องประชุมได้</DialogTitle>
                <DialogContent sx={{ width: '450px' }}>
                    <DialogContentText id="alert-dialog-slide-description">
                        <Alert severity="error">ไม่สามารถจองห้องประชุมนอกเขตของท่านได้ โปรดจองห้องประชุมเฉพาะในพื้นที่เขตของท่าน</Alert>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClick}>ตกลง</Button>
                </DialogActions>
            </Dialog>
        </>
    )
};

export const SessionExpired = () => {
    const { instance } = useMsal();
    const handleClose = () => {
        localStorage.clear();
        instance.logoutPopup().catch(e => {
            console.error(e);
        });
    };
    return (
        <>
            <Dialog
                open={true}
                TransitionComponent={Transition}
                keepMounted
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle color='error'>Session Expired</DialogTitle>
                <DialogContent sx={{ width: '450px' }}>
                    <DialogContentText id="alert-dialog-slide-description">
                        <Alert severity="error">Your session has expired. please login again.</Alert>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} variant="outlined" size='small'>Login</Button>
                </DialogActions>
            </Dialog>
        </>
    )
};

export const DeleteEmployee = ({ confirmDelete, formData, handleDelete, setConfirmDelete }) => {
    return (
        <>
            <Dialog
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
                open={confirmDelete}
                TransitionComponent={Transition}
                keepMounted
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>คุณแน่ใจหรือไม่</DialogTitle>
                <DialogContent sx={{ width: '450px' }}>
                    <DialogContentText id="alert-dialog-slide-description">
                        <Alert severity="error">คุณแน่ใจหรือไม่ว่าจะลบข้อมูลพนักงานของ {formData.iname + formData.fname + ' ' + formData.lname}</Alert>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button color="error" onClick={() => setConfirmDelete(false)}>ยกเลิก</Button>
                    <Button onClick={handleDelete}>ลบผู้ใช้งาน</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export const DisableDateClick = ({ setPastDate, pastDate }) => {
    return (
        <>
            <Dialog
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
                open={pastDate}
                TransitionComponent={Transition}
                keepMounted
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>ไม่สามารถจองห้องประชุมได้</DialogTitle>
                <DialogContent sx={{ width: '450px' }}>
                    <DialogContentText id="alert-dialog-slide-description">
                        <Alert severity="warning">ไม่สามารถจองห้องประชุมในวันที่ผ่านมาแล้วได้</Alert>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPastDate(false)}>ตกลง</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};