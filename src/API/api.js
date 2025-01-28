import axios from "axios";

export const sendTokenToBackend = async (accessToken) => {
    try {
        const response = await axios.post('https://tso-meeting-room.pttplc.com/api/auth', {
            token: accessToken,
        });
        if (response.data && response.data.jwtToken) {
            localStorage.setItem('jwtToken', response.data.jwtToken);
            //console.log('JWT Token from Backend:', response.data.jwtToken);
        } else {
            console.error('No JWT Token returned from the backend');
        }
    } catch (error) {
        console.error('Error sending token to backend:', error.response || error.message || error);
    }
};


// Create an Axios instance
const api = axios.create({
    baseURL: 'https://tso-meeting-room.pttplc.com/api/auth',
});

// Add a request interceptor to include the JWT token in the headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const GetOtherUserData = async (code) => {
    try {
        const response = await api.get(`/users/code/${code}`);
        return response;
    } catch (error) {
        console.error('Error get other user data:', error);
        throw error;
    }
};

export const Login = async (code) => {
    try {
        const response = await api.post('/login',
            {
                code: code
            }
        )
        return response
    } catch (error) {
        console.error('Error login failed: ', error);
        throw error;
    }
}

export const GetRoomByLocation = async (location_id,code) => {
    try {
        const response = await api.get(`/rooms/available/location/${location_id}`)
        return response
    } catch (error) {
        console.log('Error get room: ', error)
        throw error
    }
}

export const GetAllLocations = async () => {
    try {
        const response = await api.get(`/location/all`);
        return response
    } catch (error) {
        console.log('Error get all locations: ', error)
        throw error
    }
}

export const GetAllBookings = async (currentYearMonth) => {
    try {
        const response = await api.post(`/booking/`, { currentYearMonth })
        return response
    } catch (error) {
        console.log('Error get all Bookings: ', error)
        throw error
    }
}


export const MyBookingAll = async (code) => {
    try {
        const response = await api.get(`/booking/${code}`)
        return response
    } catch (error) {
        console.log('Error get all My Bookings:', error);
        throw error;
    }
}

export const getBookingById = async (id) => {
    try {
        return await api.get(`/booking_by_id/${id}`);
    } catch (error) {
        console.log('Error get booking with id: ', error)
        throw error
    }
}

export const getBookingByIdDisplay = async (id) => {
    try {
        return await api.get(`/booking_by_id/display/${id}`);
    } catch (error) {
        console.log('Error get booking with id diaplay: ', error)
        throw error
    }
}

export const softDelete = async (meeting_id, isAdmin, updateData, usercode, method) => {
    try {
        if (isAdmin) {
            return await api.put(`/admin/booking/${meeting_id}`, { updateData, usercode, method })
        } else {
            return await api.put(`/booking/${meeting_id}`, { updateData, usercode, method })
        }
    } catch (error) {
        console.log('Error delete bookings: ', error)
        throw error
    }
}

export const createBooking = async (array) => {
    try {
        return await api.post(`/booking/create`, { array });
    } catch (error) {
        console.log('Error create bookings: ', error)
        throw error
    }
}

export const createUser = async (array,) => {
    try {
        return await api.post(`/users/`, { array });
    } catch (error) {
        console.log('Error create user: ', error)
        throw error
    }
}

export const getUserByAreaManager = async (user) => {
    try {
        return await api.get(`/admin/users/`, { user });
    } catch (error) {
        console.log('Error get all user: ', error)
        throw error
    }
}

export const updateUser = async (code, updateData) => {
    try {
        return await api.put(`/users/${code}`, { updateData });
    } catch (error) {
        console.log('Error update user: ', error)
        throw error
    }
}

export const DeleteEmployeeData = async (code) => {
    try {
        return await api.post(`/admin/user/disable`, { code });
    } catch (error) {
        console.log('Error delete user: ', error)
        throw error
    }
}

export const getAllRoomsData = async () => {
    try {
        return await api.get(`/rooms/`);
    } catch (error) {
        console.log('Error get all Rooms: ', error)
        throw error
    }
}