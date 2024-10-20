const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('banner')
		.setDescription('Your banner picture')
        .addSubcommand(subcommand =>
            subcommand
                .setName('own')
                .setDescription('Your banner'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Banner of provided user')
                .addUserOption(option => 
                    option
                        .setName('target')
                        .setDescription('Tag or id of user')
                        .setRequired(true))),
    async execute(interaction) {
        await interaction.deferReply();
        if (interaction.options.getSubcommand() === 'own') {
            let response = interaction.user.fetch(true);
            console.log(response);

            response
                .then(user => {
                    console.log('FETCH OK');

                    if (user.bannerURL() == null) {
                        interaction.editReply('You have no banner.');
                    } else {
                        let len = user.bannerURL().length;
                        if (user.bannerURL().includes('a_')) {
                            interaction.editReply('banner: ' + user.bannerURL().substring(0, len - 5) + '.gif?size=1024')
                        } else {
                            interaction.editReply('banner: ' + user.bannerURL().substring(0, len - 5) + '.png?size=1024')
                        }
                    }
                })
                .catch(err => {
                    console.log('FETCH REJECTED');
                    console.log(err);
                    interaction.editReply('Something went wrong. Try again.');
                });
        } else {
            const id = interaction.options.get('target', true).value;

            interaction.options.client.users.fetch(id, true)
                .then(user => {
                    let response = user.fetch(true);
                    console.log(response);

                    response
                        .then(user => {
                            console.log('FETCH OK');
                            
                            if (user.bannerURL() == null) {
                                interaction.editReply('User has no banner.');
                            } else {
                                let len = user.bannerURL().length;
                                if (user.bannerURL().includes('a_')) {
                                    interaction.editReply('banner: ' + user.bannerURL().substring(0, len - 5) + '.gif?size=1024')
                                } else {
                                    interaction.editReply('banner: ' + user.bannerURL().substring(0, len - 5) + '.png?size=1024')
                                }
                            }
                        })
                        .catch(err => {
                            console.log('FETCH REJECTED');
                            console.log(err);
                            interaction.editReply('Something went wrong. Try again.');
                        });
                })
                .catch(err => {
                    console.log('FETCH REJECTED');
                    console.log(err);
                    interaction.editReply('User not found.');
                });
        }
    },
};