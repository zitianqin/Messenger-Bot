const { ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('node:path');
const { helpGuideURL } = require(path.join(__dirname, 'constants.json'));

const editButton = new ButtonBuilder()
	.setCustomId('edit')
	.setLabel('Edit')
	.setStyle(ButtonStyle.Primary);

const deleteButton = new ButtonBuilder()
	.setCustomId('delete')
	.setLabel('Delete')
	.setStyle(ButtonStyle.Danger);

const previousButton = new ButtonBuilder()
	.setCustomId('previous')
	.setLabel('Previous')
	.setStyle(ButtonStyle.Secondary);

const nextButton = new ButtonBuilder()
	.setCustomId('next')
	.setLabel('Next')
	.setStyle(ButtonStyle.Secondary);

const helpButton = new ButtonBuilder()
	.setLabel('Help')
	.setURL(helpGuideURL)
	.setStyle(ButtonStyle.Link);

module.exports = {
	editButton,
	deleteButton,
	previousButton,
	nextButton,
	helpButton,
};