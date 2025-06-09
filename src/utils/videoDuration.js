import { getVideoDurationInSeconds as getVideoDuration } from 'get-video-duration'; 

const getVideoDurationInSeconds = async (filePath) => {
    try {
        // Get duration in seconds using get-video-duration package
        const duration = await getVideoDuration(filePath);
        return Math.round(duration); // Round to nearest second
    } catch (error) {
        throw new Error(`Error getting video duration: ${error.message}`);
    }
};

export { getVideoDurationInSeconds }