const axios = require('axios');

// Function to fetch plane photo from the planespotters.net API
// Returns an object with thumbnailSrc and photographer if found, otherwise returns blank information
async function getPlanePhoto(hexCode) {
    try {
        const apiUrl = `https://api.planespotters.net/pub/photos/hex/${hexCode}`;
        const response = await axios.get(apiUrl);
        
        // Extract the first photo object from the API response
        const firstPhoto = response.data.photos[0];
        
        if (!firstPhoto) {
            // If no photo found, return blank information
            return { thumbnailSrc: '', photographer: '' };
        }
        
        // Extract thumbnail source and photographer from the first photo
        const thumbnailSrc = firstPhoto.thumbnail.src;
        const photographer = firstPhoto.photographer;
        
        return { thumbnailSrc, photographer };
          
    } catch (error) {
        console.error('Error fetching plane photo:', error);
        // If an error occurs, return blank information
        return { thumbnailSrc: '', photographer: '' };
    }
}

module.exports = { getPlanePhoto };
