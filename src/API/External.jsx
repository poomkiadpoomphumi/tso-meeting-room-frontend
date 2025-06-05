import axios from 'axios';
// import dotenv from 'dotenv'

// const env = dotenv.config().parsed;

export const GetUserDataFromAD = async (code) => {
    try {
        //try primary AD API first
        const response = await axios.get(`https://tso-meeting-room.pttplc.com/data/empdata/empcode/${code}`);
        return response.data;;
    } catch (primaryError) {
        console.error('Primary API failed, attempting to use backup API:', primaryError);
        try {
            // If the primary API fails, call the backup API
            const backupResponse = await axios.post('https://tso-data-gw.pttplc.com/api/iPortal/Employee/v1',
                {
                    code: code
                }, {
                headers: {
                    'Content-Type': 'application/json', 
                    'KeyId': '019ec11a-6c41-4b39-b3f5-356aa973b474'
                }
            }
            );
            return backupResponse.data[0];
        } catch (backupError) {
            console.error('Backup API also failed:', backupError);
            throw backupError;
        }
    }
}

export const checkTSO = async (code) => {
    try {
        const response = await axios.get(`https://tso-meeting-room.pttplc.com/data/checkTSO/empcode/${code}`);
        return response;
    } catch (error) {
        console.error('Error check TSO user:', error);
        throw error;
    }
};
