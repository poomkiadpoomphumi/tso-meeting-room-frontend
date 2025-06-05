import CryptoJS from 'crypto-js';
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

export const encryptData = (data) => {
    if (!SECRET_KEY) throw new Error("SECRET_KEY is missing.");

    try {
        const cipherText = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
        return cipherText;
    } catch (error) {
        console.error("Encryption failed:", error.message);
        throw new Error("Failed to encrypt data.");
    }
};

  
export const decryptData = (cipherText) => {
    if (!SECRET_KEY) throw new Error("SECRET_KEY is missing.");

    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedData) throw new Error("Decryption result is empty.");

        return JSON.parse(decryptedData);
    } catch (error) {
        console.error("Decryption failed:", error.message);
        throw new Error("Failed to decrypt data.");
    }
};

const convertCurrentDateTimeThai = () => {
    const currentDate = new Date();
    const fDate = currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    currentDate.setHours(currentDate.getHours() - 7); // Subtract 7 hours
    const fTime = currentDate.toTimeString().split(' ')[0]; // HH:MM:SS
    return `${fDate}T${fTime}.000Z`;
};

const adjustTimeByHours = (dateString, timeString, hours) => {
    const [hoursPart, minutesPart] = timeString.split(':');
    const previousDate = parseInt(hoursPart, 10) - 7;
    const date = new Date();
    date.setUTCHours(parseInt(hoursPart, 10) - hours, parseInt(minutesPart, 10));
    let checkDatePrevious = new Date(dateString);
    if (previousDate < 0) {
        checkDatePrevious.setDate(checkDatePrevious.getDate() - 1);
    }
    const getDate = new Date(checkDatePrevious);
    const newDate = getDate.toISOString().split('T')[0];
    const adjustedHours = date.getUTCHours().toString().padStart(2, '0');
    const adjustedMinutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${newDate}T${adjustedHours}:${adjustedMinutes}:00.000Z`;
};

export const cleanFormData = (data, room_data, usercode) => {
    const getConferenceDetail = () => {
        const conferenceKey = Object.keys(data.selectedOptionVideo).find(k => data.selectedOptionVideo[k]);
        return conferenceKey ? `ใช้งาน ${conferenceKey}` : '';
    };

    const parseMealTime = (time) => {
        const [hour, minute] = time.split(':');
        return { hour: hour || '', minute: minute || '' };
    };

    const createMealDetails = (mealOption, mealService) => ({
        order: mealOption.menuList,
        time_h: parseMealTime(mealOption.time).hour,
        time_m: parseMealTime(mealOption.time).minute,
        check: mealService ? '1' : '',
        peoplenumber: mealOption.peoplenumber,
        perbudget: mealOption.perbudget,
        place: mealOption.outside,
        owner: mealOption.prepare,
    });

    const cleanMenu = {};
    if (data.mealService.morning === true) {
        cleanMenu.morning = createMealDetails(data.mealOption.morning, data.mealService.morning);
    }
    if (data.mealService.noon === true) {
        cleanMenu.lunch = createMealDetails(data.mealOption.noon, data.mealService.noon);
    }
    if (data.mealService.evening === true) {
        cleanMenu.afternoon = createMealDetails(data.mealOption.evening, data.mealService.evening);
    }

    const time_start = adjustTimeByHours(data.date_start, data.startTime, 7);
    const time_end = adjustTimeByHours(data.date_end, data.endTime, 7);


    const hasCatering = Object.values(data.mealService).some(value => value);
    return {
        meeting_id: room_data.meeting_id || '',
        meeting_title: data.topic,
        meeting_datetime_start: time_start,//room_data.meeting_datetime_start || time_start,
        meeting_datetime_end: time_end,//room_data.meeting_datetime_end || time_end,
        meeting_description: data.details,
        room_name: data.room_name,
        room_id: room_data.room_id,
        meeting_participant_count: data.peopleCount,
        meeting_department_name: data.bookerUnit,
        meeting_reserver_name: data.bookerName,
        meeting_reserver_phone: data.contactNumber,
        meeting_room_type: data.meeting_room_type,
        meeting_catering_detail: hasCatering ? encodeToHtmlEntities(cleanMenu) : '',
        meeting_conference_detail: getConferenceDetail(),
        meeting_conference_app: 'NULL',
        meeting_video_id: data.meeting_video_id,
        meeting_update_timestamp: convertCurrentDateTimeThai(),
        meeting_update_employee_id: usercode,
        meeting_insert_timestamp: room_data.meeting_insert_timestamp || convertCurrentDateTimeThai(),
        meeting_insert_employee_id: room_data.meeting_insert_employee_id || '',
    };
};


export const decodeHtmlEntities = (inputJSON) => {
    if (inputJSON) {
        const decodedData = {};
        const decodedJSON = inputJSON.replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");
        const data = JSON.parse(decodedJSON);
        const decodeUnicode = (str) => decodeURIComponent(JSON.parse(`"${str}"`));

        for (const key in data) {
            decodedData[key] = {};
            for (const subKey in data[key]) {
                decodedData[key][subKey] = decodeUnicode(data[key][subKey]);
            }
        }

        // Return the decodedData wrapped in an array
        return [decodedData]; // Wrap the object in an array
    } else {
        return []; // Return an empty array if inputJSON is falsy
    }
};

// Function to encode a JSON object into the desired HTML-encoded string
export const encodeToHtmlEntities = (jsonObj) => {
    return JSON.stringify(jsonObj)
        .replace(/"/g, "&quot;")
        .replace(/[\u007F-\uFFFF]/g, (char) =>
            `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
        );
};

export const getMealDetails = (mealType, mealServiceData) => {
    const mealData = mealServiceData.length > 0 ? mealServiceData[0][mealType] : null;
    const check = mealData?.check === '1';
    return {
        check,
        menuList: check ? mealData.order : '',
        time: check ? `${mealData.time_h.padStart(2, '0')}:${mealData.time_m.padStart(2, '0')}` : '',
        peoplenumber: check ? (mealData.peoplenumber || "0").toString() : "0",
        perbudget: check ? (mealData.perbudget || "0").toString() : "0",
        outside: check ? mealData.place : 'นอกห้อง',
        prepare: check ? mealData.owner : 'ผู้จองเตรียมเอง',
    };
};

export const isAuthorized = (isOwner, isAdmin, location) => {
    return (
        isOwner ||
        (isAdmin === 'superadmin') ||
        (location === '1' && isAdmin === 'admin1') ||
        (location === '2' && isAdmin === 'admin2') ||
        (location === '3' && isAdmin === 'admin3') ||
        (location === '5' && isAdmin === 'admin5') ||
        (location === '6' && isAdmin === 'admin6') ||
        (location === '9' && isAdmin === 'admin9') ||
        (location === '12' && isAdmin === 'admin12')
    );
};

export const admin = ['superadmin', 'admin1', 'admin2', 'admin3', 'admin5', 'admin6', 'admin9', 'admin12'];

export const checkRuleLocation = (location) => {
    const userData = localStorage.getItem('userData');
    const decryptArray = decryptData(userData);
    const isAdmin = admin.includes(decryptArray.isAdmin);
    if (decryptArray?.location?.length > 0) {
        if (location === decryptArray.location || isAdmin) {
            return true;
        } else {
            return false;
        }

    }
    if (!('location' in decryptArray) || isAdmin) {
        return true;
    } else {
        return false;
    }
}

export const updateInSide = (mealOption) => ({
    morning: { ...mealOption.morning, outside: 'ในห้อง' },
    noon: { ...mealOption.noon, outside: 'ในห้อง' },
    evening: { ...mealOption.evening, outside: 'ในห้อง' }
});
export const updateOutSide = (mealOption) => ({
    morning: { ...mealOption.morning, outside: 'นอกห้อง' },
    noon: { ...mealOption.noon, outside: 'นอกห้อง' },
    evening: { ...mealOption.evening, outside: 'นอกห้อง' }
});