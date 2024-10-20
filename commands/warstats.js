const { SlashCommandBuilder } = require('discord.js');
const { clientCOC, pollclientCOC, getWinner, getWarStatisticsString, toMinutesAndSecondsString } = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warstats')
		.setDescription('Statistics of current war of given clan')
        .addStringOption(option => 
            option
                .setName('tag')
                .setDescription('Tag of clan')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const tag = interaction.options.get('tag', true).value;

        console.log(tag);
        pollclientCOC.getClanWar(tag)
            .then(warStats => {
                console.log(warStats);

                const endDate = new Date(warStats.endTime);
                const startDate = new Date(warStats.startTime);
                const milisecondsEnd = endDate.getTime() / 1000;
                const milisecondsStart = startDate.getTime() / 1000;
                
                let result = '';
                if (warStats.state === 'warEnded') {
                    let winner = '';

                    if (getWinner(warStats) === 1) {
                        winner = warStats.clan.name + ' won';
                    } else if (getWinner(warStats) === -1) {
                        winner = warStats.opponent.name + ' won';
                    } else {
                        winner = 'Perfect tie!';
                    }   

                    result = '**War ended. ' + winner + '**\n\n';
                } else if (warStats.state === 'inWar') {
                    result = '**War is still happening**\n\n';
                } else {
                    result = '**Preparation time ends <t:' + milisecondsStart + ':R>**\n\n';
                }

                result += getWarStatisticsString(warStats);

                result += '\nWar ' + (warStats.state === 'warEnded' ? 'ended' : 'ends') + ' on <t:' + milisecondsEnd + '> (<t:' + milisecondsEnd + ':R>).\n\n';

                if (warStats.state !== 'warEnded') {
                    result += 'Next update in ' + toMinutesAndSecondsString(warStats.maxAge / 1000) + '.';
                }
                
                interaction.editReply(result);
            })
            .catch(err => {
                console.log(err);
                interaction.editReply('Clan is currently not in war and didn\'t play any for past few days');
            })
    },
};