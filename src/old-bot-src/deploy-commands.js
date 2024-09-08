const fs = require('node:fs');
const { REST, Routes } = require('discord.js');
const path = require('node:path');
const { clientId, guildId, token } = require(path.join(__dirname, 'config.json'));

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Grab all the command files from the commands directory
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module and deploy commands
const rest = new REST().setToken(token);

// Deploy the commands to the guild and all servers
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// Fully refresh all commands in the guild with the current set
		let data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands in the given guild (deployment) server.`);

		// Fully refresh all commands in all servers with the current set
		data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands in all servers.`);
	} catch (error) {
		console.error(error);
	}
})();
