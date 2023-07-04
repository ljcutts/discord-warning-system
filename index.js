// Require the necessary discord.js classes
const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits
} = require("discord.js");
const { token } = require("./config.json");
const {manageUserWarnings, deleteUserWarnings} = require("../warning-system/hello-prisma/index")

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, "GuildBans"] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.GuildBanAdd, async(guild) => {
  await deleteUserWarnings(guild.user.id)
});

client.on(Events.InteractionCreate, async(interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  try {
		await command.execute(interaction)
		const username = interaction.options.data[0].user.username
		const id = interaction.options.data[0].user.id
	    const strikeAmount = await manageUserWarnings(String(id))
        if(strikeAmount > 2) {
			await interaction.reply({content: `YOU HAVE BEEN BANNED`, ephemeral: true});
			await interaction.guild.members.ban(id);
		} else {
         await interaction.reply({
           content: `${username} has ${strikeAmount} out of 3 strikes before getting banned`,
           ephemeral: true,
         });
		}
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Log in to Discord with your client's token
client.login(token);


//Once a user has three strikes, they get banned
//Only Mods and Team can use this
//Users warning object will delete if they are manually banned
//Every strike lasts for 30 days, when code SlashBuilder command is ran, prisma will erase that strike if it's 30 days old