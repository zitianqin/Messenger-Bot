const path = require("node:path");
const { getData, setData } = require(path.join(__dirname, "dataStore.js"));
const { EmbedBuilder } = require("discord.js");

/**
 * Sends a message to a specific channel.
 * @param {Client} client - The Discord client.
 * @param {string} channelID - The ID of the channel to send the message to.
 * @param {string} message - The message to send.
 * @param {Array} attachments - The attachments to send with the message.
 * @param {Array} embeds - The embeds to send with the message.
 */
async function sendMessage(
  client,
  channelID,
  message,
  attachments = [],
  embeds = []
) {
  try {
    const channel = await client.channels.fetch(channelID);
    await channel.send({
      content: message,
      files: attachments,
      embeds: embeds,
    });
  } catch (error) {
    console.error(error);
  }
}

/**
 * Converts a user's or role's id to a mentionable string.
 * @param {string} userId - The ID of the user or role.
 * @returns {string} - The mentionable string.
 */
function userIdToMentionable(userId) {
  return `<@${userId}>`;
}

/**
 * Sends any outstanding reminders.
 * Assumes that the reminders are sorted by unixReminderTime.
 * @param {Client} client - The Discord client.
 */
async function sendScheduledMessages(client) {
  const data = getData();
  const currentDate = new Date();
  const currentTime = Math.floor(currentDate.getTime() / 1000);

  const remindersToSend = [];
  for (const reminder of data.reminders) {
    if (reminder.unixReminderTime <= currentTime) {
      remindersToSend.push(reminder);
    }
  }

  for (const reminder of remindersToSend) {
    if (!reminder.anonymous) {
      const msg_author_embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setDescription(
          `This message was scheduled by ${userIdToMentionable(
            reminder.user.id
          )}.`
        );
      try {
        await sendMessage(
          client,
          reminder.channel.id,
          reminder.reminder,
          reminder.attachments,
          [msg_author_embed]
        );
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        await sendMessage(
          client,
          reminder.channel.id,
          reminder.reminder,
          reminder.attachments
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

  data.reminders.splice(0, remindersToSend.length);
  console.log(
    `We sent out ${
      remindersToSend.length
    } scheduled messages on ${currentDate.toDateString()} at ${currentDate.toTimeString()}.\n`
  );
  setData(data);
}

/**
 * Generates a unique id.
 * @returns {string} - The unique id.
 */
function uid() {
  return (
    Date.now().toString(36) +
    Math.floor(
      Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
    ).toString(36)
  );
}

/**
 * Converts a reminder to a channel link.
 * @param {Object} reminder - The reminder object.
 * @returns {string} - The channel link.
 */
function reminderToChannelLink(reminder) {
  return `https://discord.com/channels/${reminder.channel.guildId}/${reminder.channel.id}`;
}

/**
 * Makes a string bold when sent on Discord.
 * @param {string} str - The string to make bold.
 * @returns {string} - The bold string.
 */
function bold(str) {
  return `**${str}**`;
}

/**
 * Returns a string containing all the information about a scheduled message.
 * @param {Object} message - The scheduled message object.
 * @returns {string} - The string containing all the information.
 */
function getScheduledMessageInfo(message) {
  return (
    bold("Date: ") +
    new Date(message.unixReminderTime * 1000).toDateString() +
    "\n" +
    bold("Time: ") +
    new Date(message.unixReminderTime * 1000).toTimeString() +
    "\n" +
    bold("Channel: ") +
    reminderToChannelLink(message) +
    "\n" +
    bold("Anonymous: ") +
    message.anonymous +
    "\n\n" +
    bold("Message:") +
    "\n" +
    message.reminder
  );
}

/**
 * Deletes a scheduled message with the given id.
 * @param {string} messageId - The id of the message to delete.
 */
function deleteScheduledMessage(messageId) {
  const messages = getData().reminders;
  setData({ reminders: messages.filter((r) => r.id !== messageId) });
}

/**
 * Checks if a time is valid.
 * @param {number} hour - The hour to check.
 * @param {number} minute - The minute to check.
 * @returns {boolean} - Whether the time is valid.
 */
function isValidTime(hour, minute) {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

/**
 * Checks if a date and time is valid.
 * @param {number} year - The year to check.
 * @param {number} month - The month to check.
 * @param {number} day - The day to check.
 * @param {number} hour - The hour to check.
 * @param {number} minute - The minute to check.
 * @returns {boolean} - Whether the date and time is valid.
 */
function isValidDateAndTime(year, month, day, hour, minute) {
  const date = new Date(year, month - 1, day, hour, minute);
  return (
    isValidTime(hour, minute) &&
    !isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Checks if a string is a valid URL.
 * @param {string} string - The string to check.
 * @returns {boolean} - Whether the string is a valid URL.
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = {
  sendMessage,
  userIdToMentionable,
  sendScheduledMessages,
  uid,
  reminderToChannelLink,
  bold,
  getScheduledMessageInfo,
  deleteScheduledMessage,
  isValidTime,
  isValidDateAndTime,
  isValidUrl,
};
