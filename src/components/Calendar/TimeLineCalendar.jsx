import React, { useEffect, useState } from 'react';
import Timeline, {
    TimelineHeaders,
    SidebarHeader,
    DateHeader
} from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import moment from 'moment';
import ModalDialog from '../Modal/Modal';
import { workingHour } from '../times';
import Snackbar from '../Snackbar/SnackBar';

const CalendarDays = ({
    room, view, roomArr = [], events = [], getTitle, userCode, setOpenForm, isAdmin,
    location, locationName, detailRoom, setView, selectedDate, setSelectedDate,
    MonthClick, setMonth, yearSelected, setYear, setNewDate
}) => {
    const [currentDate, setCurrentDate] = useState(moment());
    const [activeButton, setActiveButton] = useState('Today');
    const [formattedDate, setFormattedDateText] = useState(moment().format('YYYY-MM-DD'));
    const [updatedRoomArr, setUpdatedRoomArr] = useState([]);
    const [updateEvents, setUpdateEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState([]);
    const [openModal, setModal] = useState(false);
    const [alertSuccess, setAlert] = useState(false);
    const alert = localStorage.getItem('alert');
    // Update formattedDate when selectedDate, MonthClick, or yearSelected changes
    useEffect(() => {
        if (selectedDate && MonthClick && yearSelected) {
            const dateSelect = `${yearSelected}-${MonthClick}-${selectedDate}`;
            setFormattedDateText(moment(dateSelect, 'YYYY-MM-DD').format('YYYY-MM-DD'));
            setNewDate(`${yearSelected}-${MonthClick}-${selectedDate}`);
        } else {
            setFormattedDateText(currentDate.format('YYYY-MM-DD'));
            setNewDate(currentDate.format('YYYY-MM-DD'));
        }
        if(alert === 'true'){
            setAlert(true);
        }
    }, [selectedDate, MonthClick, yearSelected, currentDate,alert]);

    // Handle navigation buttons
    const handleNext = () => {
        const date = new Date();
        const month = date.getMonth() + 1;
        let dayInMonth = MonthClick ? new Date(yearSelected, MonthClick, 0).getDate() : new Date(yearSelected, month, 0).getDate();
        setCurrentDate((prev) => moment(prev).add(1, 'day'));
        setActiveButton('Next');
        if (selectedDate === dayInMonth) {
            // If it's the last day of the month, move to the first day of the next month
            let nextMonth = MonthClick === 12 ? 1 : MonthClick + 1; // If it's December (12), go to January (1)
            let nextYear = (nextMonth === 1) ? yearSelected + 1 : yearSelected;
            setYear(nextYear)
            setMonth(nextMonth); // Update month
            setSelectedDate(1); // Set to the first day of the next month
            //setdateHandle(`${nextYear}-${nextMonth}-${1}`);
        } else {
            setYear(yearSelected);
            setSelectedDate(selectedDate + 1); // Move to the next day in the same month
            setMonth(MonthClick); // Keep the same month 
            //setdateHandle(`${yearSelected}-${MonthClick}-${selectedDate + 1}`);
        }
    };

    const handleBack = () => {
        setCurrentDate((prev) => moment(prev).subtract(1, 'day'));
        setActiveButton('Back');
        if (selectedDate === 1) {
            // If it's the first day of the month, move to the last day of the previous month
            let prevMonth = MonthClick === 1 ? 12 : MonthClick - 1; // If it's January (1), go to December (12)
            let prevYear = (prevMonth === 12) ? yearSelected - 1 : yearSelected;
            let lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate(); // Get the last day of the previous month
            setMonth(prevMonth); // Update to the previous month
            setYear(prevYear); // Update to the previous year if needed
            setSelectedDate(lastDayOfPrevMonth); // Set to the last day of the previous month
        } else {
            setSelectedDate(selectedDate - 1); // Decrement by 1 day
            setMonth(MonthClick); // Keep the same month
        }
    };
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(today.getDate()).padStart(2, '0');
        return { year, month, day };
    };
    const handleToday = () => {
        const { year, month, day } = getCurrentDate()
        setMonth(month); // Update to the previous month
        setYear(year); // Update to the previous year if needed
        setSelectedDate(day);
        setCurrentDate(moment());
        setActiveButton('Today');
    };

    // Update room and events data
    useEffect(() => {
        setIsLoading(true);
        // Update room array
        const roomObj = roomArr.map(({ room_id, room_name, ...rest }) => ({
            id: room_id,
            title: room_name,
            ...rest,
        }));
        setUpdatedRoomArr(roomObj);

        // Filter events for the specific room and date
        const filteredEvents = room === 0
            ? events
            : events.filter((event) => event.room_id === room);

        const roomEvents = filteredEvents.filter(
            (e) => e.room_id > 0 && e.date === formattedDate
        );

        const updatedEvents = roomEvents.map((event) => {
            const { meeting_id, room_id, description, startTime, endTime, title, ...rest } = event;
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            let letEnd = endHour;
            if (parseInt(endHour) === 23) { letEnd += 1; } else { letEnd = endHour; }
            return {
                id: `${meeting_id}`,
                group: room_id,
                title: description.replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
                start_time: moment(currentDate).set({ hour: startHour, minute: startMinute }),
                end_time: moment(currentDate).set({ hour: letEnd, minute: endMinute }),
                room_name: title,
                tip: 'additional information',
                ...rest,
            };
        });

        setUpdateEvents(updatedEvents);
        setIsLoading(false)
    }, [roomArr, events, room, formattedDate, currentDate]);


    // Handle item click in the timeline
    const handleItemClick = (itemId) => {
        setModal(true);
        const clickedEvent = updateEvents.find((event) => event.id === itemId);

        if (clickedEvent) {
            const updateDataDefault = {
                ...clickedEvent,
                startTime: moment(clickedEvent.start_time).format('HH:mm'),
                endTime: moment(clickedEvent.end_time).format('HH:mm'),
                title: clickedEvent.room_name,
                description: clickedEvent.title,
                room_id: clickedEvent.group,
                meeting_id: clickedEvent.id,
            };
            setSelectedEvent(updateDataDefault);
        }
    };

    return (
        <>
        {alertSuccess && <Snackbar text={'ลบรายการสำเร็จ !'} />}
            <div style={styles.container}>
                <div style={styles.leftGroup}>
                    {['Today', 'Back', 'Next'].map((name, idx) => (
                        <button
                            key={idx}
                            onClick={
                                name === 'Today'
                                    ? handleToday
                                    : name === 'Back'
                                        ? handleBack
                                        : handleNext
                            }
                            style={getButtonStyle(activeButton === name)}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <div style={styles.date}>{moment(formattedDate).format('MMMM DD, YYYY')}</div>
                <div style={styles.rightGroup}>
                    {['Month', 'Day'].map((viewName, idx) => (
                        <button
                            key={idx}
                            onClick={viewName === 'Month' ? () => window.location.reload() : null}
                            style={getButtonStyle(view === viewName.toLowerCase())}
                        >
                            {viewName}
                        </button>
                    ))}
                </div>
            </div>
            {!isLoading && (
                updateEvents.length > 0 ? (
                    <Timeline
                        groups={updatedRoomArr}
                        items={updateEvents}
                        visibleTimeStart={currentDate.startOf('day').valueOf()}
                        visibleTimeEnd={currentDate.endOf('day').valueOf()}
                        lineHeight={37}
                        canMove={false} // Disables horizontal item movement
                        canResize={false} // Disables item resizing
                        canChangeGroup={false} // Disables item group changing
                        scrollable={false} // Disables vertical scrolling
                        onItemClick={(itemId) => handleItemClick(itemId)}
                        className="no-scroll"
                    >
                        <TimelineHeaders className="sticky">
                            <SidebarHeader>
                                {({ getRootProps }) => (
                                    <div {...getRootProps()} style={HeaderLeft}>
                                        ห้องประชุม
                                    </div>
                                )}
                            </SidebarHeader>
                            <DateHeader unit="primaryHeader" />
                            <DateHeader
                                style={{ height: 50, marginTop: '7px' }}
                                intervalRenderer={({ getIntervalProps, intervalContext }) => (
                                    <div
                                        {...getIntervalProps({
                                            style: HeaderTimeSlot(intervalContext.intervalText),
                                        })}
                                    >
                                        {intervalContext.intervalText}
                                    </div>
                                )}
                            />
                        </TimelineHeaders>
                    </Timeline>
                ) : (
                    <Timeline
                        groups={updatedRoomArr}
                        items={[]} // No items for an empty table
                        visibleTimeStart={currentDate.startOf('day').valueOf()}
                        visibleTimeEnd={currentDate.endOf('day').valueOf()}
                        lineHeight={37}
                        canMove={false}
                        canResize={false}
                        canChangeGroup={false}
                        scrollable={false}
                        className="no-scroll"
                    >
                        <TimelineHeaders className="sticky">
                            <SidebarHeader>
                                {({ getRootProps }) => (
                                    <div {...getRootProps()} style={HeaderLeft}>
                                        ห้องประชุม
                                    </div>
                                )}
                            </SidebarHeader>
                            <DateHeader unit="primaryHeader" />
                            <DateHeader
                                style={{ height: 50, marginTop: '7px' }}
                                intervalRenderer={({ getIntervalProps, intervalContext }) => (
                                    <div
                                        {...getIntervalProps({
                                            style: HeaderTimeSlot(intervalContext.intervalText),
                                        })}
                                    >
                                        {intervalContext.intervalText}
                                    </div>
                                )}
                            />
                        </TimelineHeaders>
                        <div style={{ textAlign: 'center', padding: '50px', fontSize: '16px', color: '#999' }}>
                            No events available for this date.
                        </div>
                    </Timeline>
                )
            )}

            {openModal && (
                <ModalDialog
                    modalIsOpen={openModal}
                    setModalIsOpen={setModal}
                    selectedEvent={selectedEvent}
                    getTitle={getTitle}
                    isAdmin={isAdmin}
                    userCode={userCode}
                    setOpenForm={setOpenForm}
                    newDate={formattedDate}
                    location={location}
                    locationName={locationName}
                    events={events}
                    detailRoom={detailRoom}
                    setView={setView}
                    roomArr={roomArr}
                />
            )}
        </>
    );
}
const HeaderLeft = {
    marginTop: '43px', marginLeft: '10px', width: '138px', border: '1px solid #bbddff'
}
const HeaderTimeSlot = (time) => {
    // Check if the provided time is in the workingHour array
    const isWorkingHour = workingHour.includes(time);
    return {
        background: isWorkingHour ? "#ccffcc" : "#fff", // Set background color based on working hours
        height: "100%",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: '2px solid #bbddff', // Top border
        borderLeft: '2px solid #bbddff', // Left border
        borderRight: '2px solid #bbddff', // Right border
        borderRadius: '4px', // Optional: Add some rounding for aesthetics
    };
};


const getButtonStyle = (isActive) => ({
    ...styles.button,
    backgroundColor: isActive ? "#e6e6e6" : "transparent",
    boxShadow: isActive ? 'inset 0 3px 5px rgba(0, 0, 0, 0.125)' : '#fff',
});

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '10px',
        borderBottom: '1px solid #ddd',
    },
    leftGroup: {
        display: 'flex',
        borderRadius: '5px',
        overflow: 'hidden',
        boxShadow: 'inset 0 3px 5px rgba(0, 0, 0, 0.125)'
    },
    date: {
        textAlign: 'center',
        flexGrow: 1,
    },
    rightGroup: {
        display: 'flex',
        borderRadius: '5px',
        overflow: 'hidden',
        boxShadow: 'inset 0 3px 5px rgba(0, 0, 0, 0.125)'
    },
    button: {
        padding: '5px 15px',
        cursor: 'pointer',
        border: '1px solid #ccc',
        backgroundColor: 'transparent',
    },
};

export default CalendarDays;

/* const groups = [
    { id: 28, title: 'Group 1' },
    { id: 29, title: 'Group 2' },
]; */
/* const items = [
    {
        id: 1,
        group: 29,
        title: 'Item 1',
        start_time: moment(currentDate).set({ hour: 8, minute: 0 }), // Set start time to 08:00
        end_time: moment(currentDate).set({ hour: 9, minute: 30 }),
    },
    {
        id: 2,
        group: 28,
        title: 'Item 2',
        start_time: moment(currentDate).set({ hour: 8, minute: 0 }), // Set start time to 08:00
        end_time: moment(currentDate).set({ hour: 9, minute: 30 }),
    },
    {
        id: 3,
        group: 29,
        title: 'Item 3',
        start_time: moment(currentDate).set({ hour: 10, minute: 30 }), // Set start time to 08:00
        end_time: moment(currentDate).set({ hour: 12, minute: 0 }),
    },
]; */