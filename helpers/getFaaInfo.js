const fs = require('fs');

// Function to search for a string in a specific column (non-case sensitive)
const searchInColumn = (filePath, searchColumnIndex, searchString, returnColumns, callback) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        // Split the data into lines
        const lines = data.split('\n');

        // Process each line
        lines.forEach(line => {
            // Split the line into fields (assuming CSV format), trim spaces, and remove consecutive spaces
            const fields = line.split(',').map(field => field.trim().replace(/\s+/g, ' '));

            // Check if the fields array has enough elements and the search string is found in the specified column
            if (fields.length >= searchColumnIndex && fields[searchColumnIndex - 1].toLowerCase().includes(searchString.toLowerCase())) {
                // Extract and return only the specified columns
                const returnValues = returnColumns.map(columnIndex => fields[columnIndex - 1]);
                callback(returnValues);
            }
        });
    });
};

module.exports = { searchInColumn };
