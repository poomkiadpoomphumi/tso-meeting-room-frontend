import React, { useEffect, useState } from 'react';
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import { toThaiTime, normalizeDateTime, IndochinaTime, orderDecode } from '../CalendarUtils';
import DialogFormEdit from '../Layout/DialogFormEdit';
import { GetUserDataFromAD } from '../../API/External';
import Loader from '../Loader/Loader';
import { ModalCancle } from '../Alert/index';
import { isAuthorized } from '../../utils/index';

const withCell = '170px';


export default function ModalDialog({
  modalIsOpen,
  setModalIsOpen,
  selectedEvent,
  getTitle,
  isAdmin,
  userCode,
  setOpenForm,
  newDate,
  location,
  locationName,
  events,
  detailRoom,
  setView,
  roomArr
}) {
  const [loading, setLoading] = useState(true);
  const [fullNameInsert, setFullNameInsert] = useState('');
  const [fullNameUpdate, setFullNameUpdate] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  // Normalize selectedEvent
  const normalizedSelectedEvent = Array.isArray(selectedEvent) ? selectedEvent[0] : selectedEvent;
  // Destructure and validate event properties
  if (!normalizedSelectedEvent) {
    console.error('Invalid event data.');
    return null;
  }
  const {
    room_id,
    startTime,
    endTime,
    title,
    meeting_department_name,
    description,
    meeting_participant_count,
    meeting_reserver_name,
    meeting_reserver_phone,
    meeting_id,
    meeting_insert_employee_id,
    fix_date_start,
    fix_date_end,
    meeting_description,
    meeting_catering_detail,
    meeting_room_type,
    meeting_conference_detail,
    meeting_insert_timestamp,
    meeting_update_employee_id,
    meeting_update_timestamp,
    meeting_datetime_start,
    meeting_datetime_end,
    meeting_video_id,
    configTimeStart,
    configTimeEnd
  } = normalizedSelectedEvent || {};
  if (!normalizedSelectedEvent) return null;
  
  useEffect(() => {
    setLoading(false);
    const fetchData = async () => {
      // Check the length condition before calling GetUserDataFromAD
      let insertName = meeting_insert_employee_id;
      let updateName = meeting_update_employee_id;

      if (meeting_insert_employee_id && meeting_insert_employee_id.length <= 6) {
        const insert_emp_id = await GetUserDataFromAD(meeting_insert_employee_id);
        insertName = insert_emp_id === "No data available"
          ? meeting_insert_employee_id
          : `${insert_emp_id.fname} ${insert_emp_id.lname}`;
      }

      if (meeting_insert_employee_id && meeting_update_employee_id.length <= 6) {
        const update_emp_id = await GetUserDataFromAD(meeting_update_employee_id);
        updateName = update_emp_id === "No data available"
          ? meeting_update_employee_id
          : `${update_emp_id.fname} ${update_emp_id.lname}`;
      }

      // Set full names
      setFullNameInsert(insertName);
      setFullNameUpdate(updateName);
    };

    fetchData();
  }, [meeting_insert_employee_id, meeting_update_employee_id]);

  const string_start = `${fix_date_start} ${configTimeStart}`;
  const string_end = `${fix_date_end} ${configTimeEnd}`;
  const fix_date_start_text = normalizeDateTime(string_start);
  const fix_date_end_text = normalizeDateTime(string_end);
  const insertTimeStamp = normalizeDateTime(IndochinaTime(meeting_insert_timestamp));
  const updateTimeStamp = normalizeDateTime(IndochinaTime(meeting_update_timestamp));

  // Combine formatted date and time
  const [insertDate_thai, insertTime_thai] = insertTimeStamp.split(" ");
  const [updateDate_thai, updateTime_thai] = updateTimeStamp.split(" ");
  const [startDate_thai, startTime_thai] = fix_date_start_text.split(" ");
  const [endDate_thai, endTime_thai] = fix_date_end_text.split(" ");
  const textStart = toThaiTime(startDate_thai, startTime_thai);
  const textEnd = toThaiTime(endDate_thai, endTime_thai);
  const insertTime = toThaiTime(insertDate_thai, insertTime_thai);
  const updateTime = toThaiTime(updateDate_thai, updateTime_thai);

  const arrayRoom = [{
    meeting_id, room_id, meeting_participant_count, meeting_reserver_name, meeting_reserver_phone,
    description, fix_date_start, fix_date_end, meeting_description, startTime, endTime, meeting_catering_detail,
    meeting_room_type, meeting_conference_detail, title, textStart, textEnd, meeting_department_name, meeting_insert_employee_id,
    meeting_insert_timestamp, meeting_datetime_end, meeting_datetime_start, meeting_video_id, configTimeStart, configTimeEnd
  }];

  useEffect(() => {
    if (meeting_insert_employee_id && userCode) {
      setIsOwner(
        meeting_insert_employee_id?.toLowerCase() === userCode.toLowerCase() ||
        meeting_update_employee_id?.toLowerCase() === userCode.toLowerCase()
      );
    }
  }, [meeting_insert_employee_id, userCode,meeting_update_employee_id]);

  const textOrder = orderDecode(meeting_catering_detail);
  const linkUpdate = `https://hq-web-s13.pttplc.com/Directory/EmpView.aspx?txtCode=${meeting_update_employee_id}`;
  const linkInsert = `https://hq-web-s13.pttplc.com/Directory/EmpView.aspx?txtCode=${meeting_insert_employee_id}`;
  const dailogArray = [
    { label: 'ห้อง', value: title },
    { label: 'หน่วยงาน', value: meeting_department_name },
    { label: 'หัวข้อ', value: description },
    ...(meeting_room_type ? [{ label: 'การจัดห้อง', value: meeting_room_type }] : []),
    ...(meeting_conference_detail ? [{ label: 'Conference', value: meeting_conference_detail }] : []),
    ...(meeting_video_id ? [{ label: 'Meeting video id', value: meeting_video_id }] : []),
    ...(textOrder ? [{ label: 'รายการอาหาร', value: textOrder }] : []),
    { label: 'จำนวนคน', value: `${meeting_participant_count} คน` },
    { label: 'เวลาเริ่ม', value: textStart },
    { label: 'เวลาสิ้นสุด', value: textEnd },
    { label: 'ผู้จอง', value: meeting_reserver_name },
    { label: 'เบอร์ติดต่อ', value: meeting_reserver_phone },
    ...(meeting_description ? [{ label: 'รายละเอียด', value: meeting_description }] : []),
    { label: 'Created', value: fullNameInsert ? `${insertTime}<br/><a href="${linkInsert}" target="_blank">${fullNameInsert}</a>` : null },
    ...(updateTime ? [{ label: 'Last modified', value: fullNameUpdate ? `${updateTime}<br/><a href="${linkUpdate}" target="_blank">${fullNameUpdate}</a>` : null }] : []),
  ];
  if (loading) {
    return <Loader />
  }

  return (
    <>
      <Dialog open={modalIsOpen} onClose={() => setModalIsOpen(false)} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description" >
        <DialogTitle id="alert-dialog-title" style={{ width: '500px' }}>
          {getTitle(normalizedSelectedEvent)}
        </DialogTitle>
        <DialogContent sx={{ width: '500px', marginTop: '-10px' }}>
          <DialogContentText id="alert-dialog-description">
            <TableContainer component={Paper} sx={{ borderRadius: "5px", mt: 0, marginLeft: "0px", boxShadow: "none", border: "1px solid #ccc" }}>
              <Table>
                <TableBody>
                  {dailogArray.map(({ label, value }, index) => (
                    <TableRow key={index} sx={{ padding: 0 }}>
                      <TableCell sx={{ width: withCell, padding: '5px 17px' }}>
                        <Typography variant="body1"><strong>{label}</strong></Typography>
                      </TableCell>
                      {label === 'Created' || label === 'Last modified' ? (
                        <TableCell sx={{ padding: '5px 17px' }}>
                          {value ? (
                            <Typography
                              variant="body1"
                              dangerouslySetInnerHTML={{ __html: value }}
                            />
                          ) : (
                            <>
                              <Skeleton variant="text" width={220} height={30} />
                              <Skeleton variant="text" width={220} height={30} sx={{ marginTop: '-10px' }} />
                            </>
                          )}
                        </TableCell>
                      ) : label === 'หัวข้อ' || label === 'รายละเอียด' ? (
                        <TableCell sx={{ padding: '5px 17px', whiteSpace: 'pre-line' }}>
                          <Typography variant="body1">{value.replace(/&quot;/g, '"')}</Typography>
                        </TableCell>
                      ) : (
                        <TableCell sx={{ padding: '5px 17px', whiteSpace: 'pre-line' }}>
                          <Typography variant="body1">{value}</Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                </TableBody>
              </Table>

            </TableContainer>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {isAuthorized(isOwner, isAdmin, location) && (
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<CancelPresentationIcon />}
              onClick={() => setOpenConfirm(true)}
            >
              ลบรายการ
            </Button>
          )}
          {isAuthorized(isOwner, isAdmin, location) && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={<EditIcon />}
              onClick={() => setOpenEdit(true)}
            >
              แก้ไข
            </Button>
          )}
          <Button size="small" variant="contained" onClick={() => setModalIsOpen(false)}>
            ตกลง
          </Button>
        </DialogActions>
      </Dialog>

      <DialogFormEdit
        openForm={openEdit}
        setOpenForm={setOpenForm}
        newDate={newDate}
        location={location}
        locationName={locationName}
        events={events}
        roomIdx={room_id}
        roomNamex={title}
        detailRoom={detailRoom}
        setView={setView}
        setModalIsOpen={setModalIsOpen}
        date_edit={newDate}
        arrayRoom={arrayRoom}
        roomArr={roomArr}
      />

      <ModalCancle
        room_id={room_id}
        meeting_id={meeting_id}
        openConfirm={openConfirm}
        setOpenConfirm={setOpenConfirm}
        title={title}
        dateStart={textStart}
        dateEnd={textEnd}
        setModalIsOpen={setModalIsOpen}
      />
    </>
  );
};
