import moment from 'moment';
import { decodeHtmlEntities } from '../utils/index.jsx';
import { thaiMonths } from './times.jsx';


// Function to convert 24-hour time to 12-hour format
export const convertTo12HourFormat = (time) => {
    const [hour, minute] = time.split(":");
    let hour12 = parseInt(hour, 10);
    const period = hour12 >= 12 ? 'PM' : 'AM';
    if (hour12 > 12) hour12 -= 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${minute} ${period}`;
}

// Function to convert 12-hour time to 24-hour format
const convertTo24HourFormat = (time) => {
    const [hourMin, period] = time.split(" "); // Split the time and period (AM/PM)
    const [hour, minute] = hourMin.split(":");
    let hour24 = parseInt(hour, 10);
    if (period === "PM" && hour24 !== 12) {
        hour24 += 12; // Convert PM hours
    } else if (period === "AM" && hour24 === 12) {
        hour24 = 0; // Convert 12 AM to 00
    }
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
}

export const convertTimeSlotsTo24HourFormat = (timeSlots) => {
    return timeSlots.map(slot => {
        const [start, end] = slot.split(" - "); // Split the start and end times
        const start24 = convertTo24HourFormat(start);
        const end24 = convertTo24HourFormat(end);
        return `${start24} - ${end24}`;
    });
}

// Function to check availability based on bookings
export const checkAvailability = (bookings, times) => {
    // Convert all 24-hour booking times to 12-hour format
    const busyIntervals = bookings.map((booking) => ({
        start: convertTo12HourFormat(booking.startTime),
        end: convertTo12HourFormat(booking.endTime),
    }));
    // Find indices of the busy intervals in the 'times' array
    const busyTimes = busyIntervals.map((interval) => {
        const startIdx = times.indexOf(interval.start);
        const endIdx = times.indexOf(interval.end);
        return { startIdx, endIdx };
    });

    const availableTimes = [];
    let lastEndIdx = 0;
    // Check for available times before and after each busy interval
    busyTimes.forEach((interval) => {
        // Before the busy interval
        if (lastEndIdx < interval.startIdx) {
            availableTimes.push(`${times[lastEndIdx]} - ${times[interval.startIdx - 1]}`);
        }
        lastEndIdx = interval.endIdx + 1;
    });
    // Add time after the last busy interval
    if (lastEndIdx < times.length) {
        availableTimes.push(`${times[lastEndIdx]} - ${times[times.length - 1]}`);
    }

    return availableTimes;
};

export const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // Use 24-hour format
    });
};

export const decodeHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent;
};

export const getTitle = (selectedEvent) => {
    const startDate = moment(selectedEvent.fix_date_start);
    const endDate = moment(selectedEvent.fix_date_end);
    const isContinuing = endDate.diff(startDate, 'days') >= 1;
    return (
        <>
            {isContinuing ? (
                <>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold', }}>
                        {selectedEvent.description}
                    </div>
                    <span style={{ fontSize: '16px' }}>
                        ต่อเนื่อง {selectedEvent.fix_date_start} ถึง {selectedEvent.fix_date_end}
                    </span>
                </>
            ) : (
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', }}
                >
                    {selectedEvent.description}
                </div>
            )}
        </>
    );
};



// Function to convert date to Thai format without time
export const toThaiTime = (dateString, time) => {
    const [year, month, day] = dateString.split('-'); // Split the date part
    const date = new Date(year, month - 1, day); // Create Date object
    // Extract day, month, year for formatting
    const dayOfMonth = date.getDate();
    const monthName = thaiMonths[date.getMonth()];
    const buddhistYear = date.getFullYear() + 543; // Convert to Buddhist year
    // Return formatted string
    return `${dayOfMonth} ${monthName} ${buddhistYear} ${time}`;
};
export const normalizeDateTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) {
        console.error('Invalid date:', dateString);
        return null;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const formatTo24Hour = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`; // 24-hour format
};

export const IndochinaTime = (utcDate) => {
    const date = new Date(utcDate);
    const options = { timeZone: "Asia/Bangkok" };
    // Format manually
    const year = date.toLocaleString("en-US", { year: "numeric", ...options });
    const month = date.toLocaleString("en-US", { month: "short", ...options });
    const day = date.toLocaleString("en-US", { day: "2-digit", ...options });
    const weekday = date.toLocaleString("en-US", { weekday: "short", ...options });
    const time = date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        ...options,
    });
    // Concatenate the output
    const formattedDate = `${weekday} ${month} ${day} ${year} ${time} (Indochina Time)`;
    return formattedDate;
}

export const orderDecode = (meeting_catering_detail) => {
    const mealServiceData = decodeHtmlEntities(meeting_catering_detail);
    let textOrder = '';
    if (mealServiceData[0]) {
        const { afternoon, lunch, morning } = mealServiceData[0];
        if (morning) {
            const { time_h, time_m, place, owner, order } = morning;
            textOrder += `${time_h}:${time_m}/${place}/${owner}/${order}\n`;
        }
        if (lunch) {
            const { time_h, time_m, place, owner, order } = lunch;
            textOrder += `${time_h}:${time_m}/${place}/${owner}/${order}\n`;
        }
        if (afternoon) {
            const { time_h, time_m, place, owner, order } = afternoon;
            textOrder += `${time_h}:${time_m}/${place}/${owner}/${order}\n`;
        }
    }
    return textOrder.trim();
}
