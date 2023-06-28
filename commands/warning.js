const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warning")
    .setDescription("Assigns a member with one strike out of three strikes before getting banned")
    .addUserOption(option =>
		option.setName('user')
			.setDescription('What member to set strike on')
            .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return await interaction.reply({
        content:
          "You do not have the necessary permissions to use this command",
        ephemeral: true,
      });
    }
  }
};
