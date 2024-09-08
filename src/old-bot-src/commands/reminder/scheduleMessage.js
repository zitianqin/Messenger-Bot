const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const path = require('node:path');
const { getData, setData } = require(path.join(__dirname, '../../dataStore.js'));
const { uid, isValidDateAndTime, isValidUrl } = require(path.join(__dirname, '../../utils.js'));
const { helpButton } = require(path.join(__dirname, '../../buttons.js'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('schedule')
		.setDescription('Schedules a message for the user.')
		.addStringOption(option =>
			option
				.setName('message')
				.setDescription('The message you want to send')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('hour')
				.setDescription('The hour of the day to send the message (24-hour format - 0 to 23)')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('minute')
				.setDescription('The minute of the hour to send the message (24-hour format - 0 to 59)')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('day')
				.setDescription('The day to send the message')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('month')
				.setDescription('The month to send the message')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('year')
				.setDescription('The year to send the message')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('attachments')
				.setDescription('Links to any media you want to attach with the message. (Separate links with a space)')
				.setRequired(false))
		.addBooleanOption(option =>
			option
				.setName('anonymous')
				.setDescription('Send message anonymously. (Default: false)')
				.setRequired(false)),

	/**
	 * Asynchronously schedules a message based on the provided interaction.
	 *
	 * This function extracts the scheduling details (hour, minute, day, month, year) and the message details (message text, attachments, anonymity) from the interaction.
	 * It then validates these details and, if valid, schedules the message for the specified time.
	 * If the details are not valid, it sends an appropriate error message back to the user.
	 *
	 * @param {Interaction} interaction - The interaction that triggered the command. It should contain the scheduling and message details.
	 * @returns {Promise<void>} - A Promise that resolves when the scheduling of the message has been completed or an error message has been sent.
	 */
	async execute(interaction) {
		const hour = interaction.options.getInteger('hour');
		const minute = interaction.options.getInteger('minute');
		const day = interaction.options.getInteger('day');
		const month = interaction.options.getInteger('month');
		const reminder = interaction.options.getString('message');
		const attachmentsOption = interaction.options.getString('attachments');
		const attachments = attachmentsOption ? attachmentsOption.split(' ') : [];
		const anonymous = interaction.options.getBoolean('anonymous') || false;

		const date = new Date();
		const unixTime = Math.floor(date.getTime() / 1000);

		// Adjust the year (since it is optionally given by the user) depending on if it will make the reminder be in the past.
		// This will make the reminder be the earliest possible time in the future.
		let year;
		if (interaction.options.getInteger('year')) {
			year = interaction.options.getInteger('year');

		} else {
			const givenDate = new Date(date.getFullYear(), month - 1, day, hour, minute);
			const unixGivenTime = Math.floor(givenDate.getTime() / 1000);

			if (unixGivenTime < unixTime) {
				givenDate.setFullYear(givenDate.getFullYear() + 1);
			}

			year = givenDate.getFullYear();
		}

		const reminderDateAndTime = new Date(year, month - 1, day, hour, minute);
		const unixReminderTime = Math.floor(reminderDateAndTime.getTime() / 1000);

		// Create a new ActionRowBuilder instance and add the helpButton to it
		const helpButtonRow = new ActionRowBuilder().addComponents(helpButton);

		// Check for invalid date and time inputs
		if (!isValidDateAndTime(year, month, day, hour, minute)) {
			await interaction.reply({ content: 'Please provide a valid date and time.', components: [helpButtonRow], ephemeral: true });
			return;
		} else if (unixReminderTime <= unixTime) {
			await interaction.reply({ content: 'Please provide a date and time in the future.', components: [helpButtonRow], ephemeral: true });
			return;
		} else if (reminder.length > 1800) {
			await interaction.reply({ content: 'Your total message length cannot be more than 1800 characters long.', components: [helpButtonRow], ephemeral: true });
			return;
		} else if (attachments.length > 10) {
			await interaction.reply({ content: 'You can only attach up to 10 links.', components: [helpButtonRow], ephemeral: true });
			return;
		} else if (!attachments.every(isValidUrl)) {
			await interaction.reply({ content: 'Please provide valid URLs for attachments.\n\nURLs must begin with `http://` or `https://`.', components: [helpButtonRow], ephemeral: true });
			return;
		} else if (interaction.guildId == null || interaction.channel == null) {
			await interaction.reply({ content: 'This command can only be used in a server channel that the bot can read and send messages in.', components: [helpButtonRow], ephemeral: true });
		}

		// Insert data into the dataStore
		const data = getData();
		const reminders = data.reminders;
		const newItem = { id: uid(), channel: interaction.channel, user: interaction.user, reminder: reminder, unixReminderTime: unixReminderTime, attachments: attachments, anonymous: anonymous };

		// Insert the new message into the array in the position after all previous messages that are scheduled to be sent before or at the same time as the new message.
		let index = 0;
		while (index < reminders.length && reminders[index].unixReminderTime <= newItem.unixReminderTime) {
			index++;
		}

		reminders.splice(index, 0, newItem);
		setData(data);

		const msg_author_embed = new EmbedBuilder().setColor(0x0099FF);
		if (anonymous) {
			msg_author_embed.setDescription(`I will send the following message on ${reminderDateAndTime.toDateString()} in this channel at ${reminderDateAndTime.toTimeString()}:\n\n${reminder}`);
		} else {
			msg_author_embed.setDescription(`I will send the following message on ${reminderDateAndTime.toDateString()} in this channel at ${reminderDateAndTime.toTimeString()}:\n\n${reminder}\n\nThis message was scheduled by ${interaction.user}.`);
		}
		await interaction.reply({ files: attachments, embeds: [msg_author_embed], ephemeral: true });
	},
};