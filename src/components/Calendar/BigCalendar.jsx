import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../css/Calendar.css'

import TimeLineCalendar from './TimeLineCalendar';
import DailogForm from '../Layout/DialogForm';
import { GetAllBookings } from '../../API/api';
import Loader from '../Loader/Loader';
import { formatTime,getTitle } from '../CalendarUtils';
import ModalDialog from '../Modal/Modal';
import Snackbar from '../Snackbar/SnackBar';
import { DisableDateClick } from '../Alert/index';

const localizer = momentLocalizer(moment);

const BigCalendar = ({ roomArr, openForm, setOpenForm, windowWidth, location, locationName, room, roomName, detailRoom, isAdmin, userCode }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState("month");
  const [selectedDate, setSelectedDate] = useState('');
  const [alternate, setAlternate] = useState(false);
  const [MonthClick, setMonth] = useState('');
  const [newDate, setNewDate] = useState('');
  const [yearSelected, setYear] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([])
  const [previous, setProvious] = useState(false);
  const currentDay = moment().format('YYYY-MM-DD');
  const dateSelect = newDate || moment().format('YYYY-MM-DD');
  const parsedDate = moment(dateSelect, 'YYYY-MM-DD');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [currentYearMonth, setCurrentYearMonth] = useState(moment().format('YYYY-MM'));
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const alert = localStorage.getItem('alert');
  const save = localStorage.getItem('save');
  const [alertSuccess, setAlert] = useState(false);
  const [saveSuccess, setSave] = useState(false);
  const [pastDate,setPastDate] = useState(false);
  
  const fetchBookingData = useCallback(async () => {
    try {
      const data = await GetAllBookings(currentYearMonth);
      setEvents(data.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false); // Set loading to false when data fetch is complete
    }
  }, [currentYearMonth]);

  useEffect(() => { fetchBookingData(); }, [currentYearMonth, fetchBookingData]);

  const handleNavigate = (date, view, action) => {
    setEvents([]); // Clear the existing events when navigating
    if (action === 'NEXT') {
      setCurrentYearMonth((prev) =>
        moment(prev, 'YYYY-MM').add(1, 'month').format('YYYY-MM')
      );
    } else if (action === 'PREV') {
      setCurrentYearMonth((prev) =>
        moment(prev, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM')
      );
    } else if (action === 'TODAY') {
      window.location.reload();
    }
    fetchBookingData();
  };

  // Filtering by location_id and room_id
  useEffect(() => {
    if (events.length === 0) return; // Only proceed if events is not empty
    let filtered = [...events]; // Create a shallow copy of events to avoid direct mutation
    if (room !== 0 || room > 0) {
      filtered = filtered.filter(event => event.room_id === room);
    }
    if (location || room > 0) {
      filtered = filtered.filter(event => event.location_id === location);
    }
    setFilteredEvents(filtered);

    if (alert === 'true') {
      setAlert(true);
      setTimeout(() => {
        setAlert(false);
        localStorage.removeItem("alert");
        window.location.reload();
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

  }, [location, room, events, alert, save]); // This effect depends on location, room, and events

  //formate startTime endTime and date to ex. Fri Mar 29 2024 09:00:00 GMT+0700 (Indochina Time)
  const formattedEvents = filteredEvents.filter(event => event.room_id > 0) // Filter events where room_id > 0
    .map(event => {
      const startDateTime = new Date(`${event.date}T${event.startTime}:00`);
      const endDateTime = new Date(`${event.date}T${event.endTime}:00`);
      return { ...event, startTime: startDateTime, endTime: endDateTime, description: /* decodeHtml( */event.description/* ) */ };
    });

  const handleSelectEvent = (event) => {
    const selectedDate = moment(event.date).format('YYYY-MM-DD');
    setNewDate(selectedDate);
    const updatedEvent = {
      ...event,
      startTime: formatTime(event.startTime),
      endTime: formatTime(event.endTime)
    };
    setSelectedEvent(updatedEvent);
    setModalIsOpen(true);
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: '#ffffff', // Customize the event's background color
        color: '#1976d2', // Customize the event's text color
        width: '99%',
        marginLeft: '1px',
        borderRadius: '5px'
      },
    };
  };

  const handleChangeViews = (view) => {
    if (view === 'day') {
      setAlternate(true);
      setView("day");
    }
    if (view === 'agenda') {
      setView("agenda");
      setAlternate(false);
    }
  };
  const handleClickMonth = () => {
    setAlternate(false);
    setView("month")
    window.location.reload()
  }
  const handleClickWeek = () => {
    setAlternate(false);
    setView("agenda")
  }

  const onClickRoom = (date) => { setOpenForm(true); setNewDate(date); }

  // Function to check if the date is today or a future day
  const getFutureDay = useCallback(() => {
    // Checks if the date is today or in the future
    const isCurrentOrFutureDay = (date) => {
      return moment(date).isSameOrAfter(currentDay, 'day');
    };
    return isCurrentOrFutureDay(dateSelect); // true if today or a future day, false otherwise
  }, [currentDay, dateSelect])

  useEffect(() => {
    if (openForm) {
      const year = parsedDate.year();   // e.g., 2024
      const month = parsedDate.month() + 1;  // e.g., 05 (month is zero-indexed, so add 1)
      const selectedDate = parsedDate.date(); // e.g., 09

      setYear(year);
      setMonth(month);
      setSelectedDate(selectedDate);
    }
    // Use the `getFutureDay` function to set `previous`
    setProvious(!getFutureDay());
  }, [dateSelect, parsedDate, openForm, getFutureDay]);
  
  const clickDateCalendar = (date) => {
    setView('day');
    setAlternate(true);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
    setSelectedDate(date.getDate());
  }

  if (loading) {
    return <Loader />
  }

  const displayIspastDate = () => {
    setPastDate(true);
  }
  const ComponentsHeader = (moment) => {
    return {
      dateHeader: ({ date }) => {
        const isPastDate = moment(date).isBefore(moment().startOf('day'));
        const formattedDate = moment(date).format('YYYY-MM-DD'); // Format the date for comparison
        return (
          <div
            className="calendar-date-header"
          >
            <span
              className={`meeting-room-label ${isPastDate ? 'hidden' : ''}`}
              onClick={!isPastDate ? () => onClickRoom(formattedDate) : () => displayIspastDate()}
            >
              จองห้องประชุม
            </span>
            <span
              className="date-label"
              onClick={() => clickDateCalendar(date)}
            >
              {moment(date).format('DD')}
            </span>
          </div>
        );
      }
    };
  };

  const CustomEvent = ({ event }) => {
    // Parse the start and end dates using moment.js
    const startDate = moment(event.fix_date_start);
    const endDate = moment(event.fix_date_end);
    const allDay = formatTime(event.startTime) === "08:00" && formatTime(event.endTime) === "17:00";
    // Check if the difference in days is more than 1
    const isContinuing = endDate.diff(startDate, 'days') >= 1;
    // State to track hover status
    const [isHovered, setIsHovered] = useState(false);
    // Handle mouse enter and leave to toggle hover state
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isHovered ? '#1976d2' : '#ffffff', // Background color on hover
          color: isHovered ? '#fff' : '#717171', // Text color on hover
          transition: 'all 0.3s ease', // Smooth transition for color change
          padding: '5px 10px', // Optional padding for better appearance
          borderRadius: '4px', // Optional rounded corners
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <strong style={{ flex: 1, textAlign: 'left', color: isHovered ? '#fff' : '#1976d2', fontSize: 'smaller' }}>{event.title}</strong>
        {
          isContinuing ? (
            <span style={{ flex: 1, textAlign: 'right', fontSize: 'smaller', color: isHovered ? '#fff' : 'orange' }}>
              ต่อเนื่อง
            </span>
          ) : allDay ? (
            <span style={{ flex: 1, textAlign: 'right', fontSize: 'smaller', color: isHovered ? '#fff' : 'green' }}>
              ทั้งวัน
            </span>
          ) : (
            <span style={{ flex: 1, textAlign: 'right', fontSize: 'smaller' }}>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          )
        }
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {alertSuccess && <Snackbar text={'ลบรายการสำเร็จ !'} />}
      {saveSuccess && <Snackbar text={'บันทึกรายการสำเร็จ !'} />}
      {pastDate && <DisableDateClick setPastDate={setPastDate} pastDate={pastDate}/>}
      <DailogForm
        roomArr={roomArr}
        openForm={openForm}
        setOpenForm={setOpenForm}
        newDate={newDate}
        setNewDate={setNewDate}
        location={location}
        locationName={locationName}
        events={events}
        roomIdx={room}
        roomNamex={roomName}
        detailRoom={detailRoom}
        setView={setView}
        previous={previous}
        //dateHandle={dateHandle}
      />
      {
        events && (alternate || view === 'day') ? (
          <TimeLineCalendar
            room={room}
            roomArr={roomArr}
            view={view}
            handleChangeViews={handleChangeViews}
            handleClickMonth={handleClickMonth}
            handleClickWeek={handleClickWeek}
            events={events} //send event to days
            style={{ height: 800 }}
            selectedDate={selectedDate} // Pass selected date to CalendarDays
            setSelectedDate={setSelectedDate}
            MonthClick={MonthClick}
            setMonth={setMonth}
            yearSelected={yearSelected}
            setYear={setYear}
            windowWidth={windowWidth}
            getTitle={getTitle}
            isAdmin={isAdmin}
            userCode={userCode}
            setOpenForm={setOpenForm}
            location={location}
            locationName={locationName}
            detailRoom={detailRoom}
            setView={setView}
            setNewDate={setNewDate}
          />
        ) : (
          <Calendar
            localizer={localizer}
            events={formattedEvents} //use formate follow library calendar
            startAccessor="startTime"
            endAccessor="endTime"
            resources={roomArr}
            defaultView={view}
            views={['month', 'day']}
            style={{ height: 800 }}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            onNavigate={handleNavigate}
            onView={handleChangeViews}
            onDrillDown={(date) => { clickDateCalendar(date) }}
            components={{
              ...ComponentsHeader(moment), // Ensure other components are retained
              event: CustomEvent, // Custom rendering for events
            }}
            tooltipAccessor={(event) => `${event.description} เวลา ${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
          />
        )
      }
      {modalIsOpen && selectedEvent && (
        <ModalDialog
          modalIsOpen={modalIsOpen}
          setModalIsOpen={setModalIsOpen}
          setSelectedEvent={setSelectedEvent}
          selectedEvent={selectedEvent}
          getTitle={getTitle}
          isAdmin={isAdmin}
          userCode={userCode}
          setOpenForm={setOpenForm}
          newDate={newDate}
          location={location}
          locationName={locationName}
          events={events}
          detailRoom={detailRoom}
          setView={setView}
          roomArr={roomArr}
        />
      )}

    </div>
  );
};

export default BigCalendar;
