const { ActionRowBuilder, SlashCommandBuilder, ComponentType, EmbedBuilder } = require('discord.js');
const path = require('node:path');
const { getData } = require(path.join(__dirname, '../../dataStore.js'));
const { getScheduledMessageInfo, deleteScheduledMessage } = require(path.join(__dirname, '../../utils.js'));
const { editButton, deleteButton, previousButton, nextButton, helpButton } = require(path.join(__dirname, '../../buttons.js'));

/**
 * Returns a string containing all the information that is to be displayed to the user about a scheduled message.
 * @param {Array} messageList - The list of messages.
 * @param {number} messageIndex - The index of the current message.
 * @returns {string} - The message to be displayed to the user.
 */
function getScheduledMessagesListContent(messageList, messageIndex) {
	if (messageList.length > 0) {
		return `Currently showing message ${messageIndex + 1} of ${messageList.length}.\n\n` + getScheduledMessageInfo(messageList[messageIndex]);
	}
	return 'You don\'t have any scheduled messages. You can schedule one with the `/schedule` command!';
}

/**
 * Returns an ActionRowBuilder object that contains the buttons for the user to interact with when using the /message command.
 * @param {Array} messageList - The list of messages.
 * @param {number} messageIndex - The index of the current message.
 * @returns {ActionRowBuilder} - The ActionRowBuilder object with the buttons.
 */
function makeRow(messageList, messageIndex) {
	if (messageList.length === 0) {
		return new ActionRowBuilder().addComponents(helpButton);
	}

	if (messageIndex === 0) {
		previousButton.setDisabled(true);
	} else {
		previousButton.setDisabled(false);
	}

	if (messageIndex === messageList.length - 1) {
		nextButton.setDisabled(true);
	} else {
		nextButton.setDisabled(false);
	}

	return new ActionRowBuilder()
		.addComponents(editButton, deleteButton, previousButton, nextButton, helpButton);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('messages')
		.setDescription('Gets a list of all the user\'s scheduled messages.'),

	/**
	 * The main function that gets a list of all the user's scheduled messages and handles the interactions.
	 * @param {Interaction} interaction - The interaction object from discord.js.
	 */
	async execute(interaction) {
		// Obtain array of user's scheduled messages
		const messages = getData().reminders;
		const userId = interaction.user.id;
		const messageList = messages.filter(message => message.user.id === userId);

		// Create response
		let messageIndex = 0;
		const messageInfoEmbed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setDescription(getScheduledMessagesListContent(messageList, messageIndex));

		const response = await interaction.reply({
			embeds: [ messageInfoEmbed ],
			components: [makeRow(messageList, messageIndex, helpButton, editButton, deleteButton, previousButton, nextButton)],
			files: messageList[messageIndex]?.attachments || [],
			ephemeral: true,
		});

		// Manage user interactions with the buttons
		const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000 });
		let originalMessage;

		collector.on('collect', async i => {
			if (i.customId === 'edit') {
				await i.reply({ content: 'Message editing coming soon!', ephemeral: true });

			} else if (i.customId === 'delete') {
				originalMessage = messageList[messageIndex];
				deleteScheduledMessage(originalMessage.id, userId, i);
				messageList.splice(messageIndex, 1);

				if (messageIndex > 0) {
					messageIndex--;
				}

				messageInfoEmbed.setDescription(`Successfully deleted the following message:\n\n${originalMessage.reminder}`);
				await i.reply({ embeds: [messageInfoEmbed], ephemeral: true });

			} else if (i.customId === 'previous') {
				if (messageIndex > 0) {
					messageIndex--;
				}
				await i.deferUpdate();

			} else if (i.customId === 'next') {
				if (messageIndex < messageList.length - 1) {
					messageIndex++;
				}
				await i.deferUpdate();
			}

			// Acknowledge the button interaction and edit the response.
			messageInfoEmbed.setDescription(getScheduledMessagesListContent(messageList, messageIndex));

			response.edit({
				embeds: [ messageInfoEmbed ],
				components: [makeRow(messageList, messageIndex, helpButton, editButton, deleteButton, previousButton, nextButton)],
				files: messageList[messageIndex]?.attachments || [],
				ephemeral: true,
			});
		});
	},
};
