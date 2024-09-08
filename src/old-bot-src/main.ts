import fs from "node:fs";
import path from "node:path";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  GuildChannel,
  TextChannel,
} from "discord.js";
const { token, loggingChannel } = require(path.join(__dirname, "config.json"));
const { sendScheduledMessages } = require(path.join(__dirname, "utils.js"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Read in commands from the 'commands' directory. All commands must be in a subfolder within the commands folder.
client.application?.commands.set([]);
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file: string) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.application?.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Check the dataStore.js file every minute and send out outstanding reminders.
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  // Send the reminders out at the start of every minute.
  const currentDate = new Date();
  const currentSecond = currentDate.getSeconds() * 1000;
  const currentMillisecond = currentDate.getMilliseconds();
  const timeToWait = 60000 - (currentSecond + currentMillisecond);

  sendScheduledMessages(client);
  setTimeout(
    setInterval,
    timeToWait,
    () => sendScheduledMessages(client),
    60000
  );
});

// When a command interaction is created, find the corresponding command and execute it.
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = await interaction.client.application.commands.fetch(
    interaction.commandId
  );

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  // Interaction Logging
  const channel = client.channels.cache.get(loggingChannel);
  const server = interaction.guild?.name;
  const user = interaction.user.username;
  const userId = interaction.user.id;

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("Chat Command Used")
    .addFields(
      { name: "Server", value: server || "", inline: true },
      { name: "User", value: user || "", inline: true },
      { name: "User ID", value: userId || "", inline: true },
      { name: "Command", value: interaction.commandName || "", inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "Command Interaction" });

  if (!(channel instanceof TextChannel)) {
    return;
  }

  await channel.send({ embeds: [embed] });

  // Execute Command
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
  }
});

client.login(token);
