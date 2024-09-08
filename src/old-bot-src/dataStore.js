const fs = require('node:fs');
const path = require('node:path');

const dataStorePath = path.join(__dirname, 'dataStore.json');

/**
 * Function to get data from the dataStore.json file.
 * If the file exists, it reads the file and parses the JSON content.
 * If the file does not exist, it logs a warning and returns an object with an empty reminders array.
 * @returns {Object} The parsed JSON data from the file, or an object with an empty reminders array if the file does not exist.
 */
function getData() {
	if (fs.existsSync(dataStorePath)) {
		return JSON.parse(String(fs.readFileSync(dataStorePath)));
	} else {
		console.log('[WARNING] The dataStore.json file called by dataStore.js is missing.');
	}
	return { reminders: [] };
}

/**
 * Function to write data to the dataStore.json file.
 * It stringifies the provided data and writes it to the file.
 * @param {Object} data - The data to write to the file.
 */
function setData(data) {
	fs.writeFileSync(dataStorePath, JSON.stringify(data, null, 2));
}

module.exports = {
	getData: getData,
	setData: setData,
};
