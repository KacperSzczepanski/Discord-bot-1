const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Your avatar picture')
        .addSubcommand(subcommand =>
            subcommand
                .setName('own')
                .setDescription('Your avatar'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Avatar of provided user')
                .addUserOption(option => 
                    option
                        .setName('target')
                        .setDescription('Tag or id of user')
                        .setRequired(true))),
    async execute(interaction) {
        await interaction.deferReply();
        if (interaction.options.getSubcommand() === 'own') {
            let len = interaction.user.displayAvatarURL().length;
            if (interaction.user.displayAvatarURL().includes('a_')) {
                await interaction.editReply('avatar: ' + interaction.user.displayAvatarURL().substring(0, len - 5) + '.gif');
            } else {
                await interaction.editReply('avatar: ' + interaction.user.displayAvatarURL().substring(0, len - 5) + '.png');
            }
        } else {
            const id = interaction.options.get('target', true).value;

            interaction.options.client.users.fetch(id)
                .then(user => {
                    console.log('fetched user:');
                    console.log(user);

                    let len = user.displayAvatarURL().length;
                    if (user.displayAvatarURL().includes('a_')) {
                        interaction.editReply('avatar: ' + user.displayAvatarURL().substring(0, len - 5) + '.gif');
                    } else {
                        interaction.editReply('avatar: ' + user.displayAvatarURL().substring(0, len - 5) + '.png');
                    }
                })
                .catch(err => {
                    console.log('FETCH REJECTED');
                    console.log(err);
                    interaction.editReply('User not found.');
                });
        }
    },
};