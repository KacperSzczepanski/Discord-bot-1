const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Lists all commands'),
	async execute(interaction) {
		let text = 'List of discord commands:\n\n' +
                   'warstats - check war statistics of clan\n' +
                   'track_clans - start/stop tracking clans in this channel or list all tracked clans here\n' + 
                   'channel_tags - save/remove tags in this chat, list all saved tags for this channel or load all tags';

        interaction.reply(text);
        //';fluxxy - tags fluxxy' + (fluxxy == false ? ' (command disabled)' : ''));
	},
};