const { SlashCommandBuilder } = require('discord.js');
const { 
    clientCOC, trackedTagsForChannel, trackingChannelsForTag,
    startTracking, stopTracking, clanWarsTrackedInChannel } = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('track_clans')
        .setDescription('About tracking clans\' wars')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start tracking clans in this channel')
                .addStringOption(option => 
                    option
                        .setName('tags')
                        .setDescription('Tag or tags of clans')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stop tracking clans in this channel')
                .addStringOption(option => 
                    option
                        .setName('tags')
                        .setDescription('Tag or tags of clans')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all clans tracked in this channel')),
    async execute(interaction) {
        await interaction.deferReply();
        if (interaction.options.getSubcommand() === 'start') {
            let result = '';
            const tags = interaction.options.get('tags', true).value.trim().split(',');
            const noOfTags = tags.length;
            
            for (i = 0; i < noOfTags; ++i) {
                tags[i] = tags[i].trim();
                console.log('i = ' + i + ', tag = ' + tags[i]);
                let response = clientCOC.getClan(tags[i]);
                
                await response
                    .then(clan => {
                        if (!clanWarsTrackedInChannel(clan.tag, interaction.channel.id)) {
                            //clientCOC.events.addWars(clan.tag);
                            //addClanWarsTrackingToChannel(clan.tag, channel.id);
                            //addChannelTrackerToTag(channel.id, clan.tag);
                            startTracking(clan.tag, interaction.channel.id);
                            
                            result += 'Clan ' + clan.name + ' (' + clan.tag + ') added to tracking.\n';
                        } else {
                            result += 'Clan ' + clan.name + ' (' + clan.tag + ') is already being tracked.\n';
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        result += 'Clan ' + tags[i] + ' not found.\n';
                    })
            }
            console.log('result = ' + result);
            interaction.editReply(result);
        } else if (interaction.options.getSubcommand() === 'stop') {
            let result = '';
            const tags = interaction.options.get('tags', true).value.trim().split(',');
            const noOfTags = tags.length;

            for (i = 0; i < noOfTags; ++i) {
                tags[i] = tags[i].trim();
                console.log('i = ' + i + ', tag = ' + tags[i]);
                let response = clientCOC.getClan(tags[i]);
    
                await response
                    .then(clan => {
                        if (clanWarsTrackedInChannel(clan.tag, interaction.channel.id)) {
                            stopTracking(clan.tag, interaction.channel.id);
            
                            result += 'Clan ' + clan.name + '(' + clan.tag + ') removed from tracking.\n';
                        } else {
                            result += 'Clan ' + clan.name + '(' + clan.tag + ') is not being tracked.\n';
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        result += 'Clan ' + tags[i] + ' not found.\n';
                    })
            }
            interaction.editReply(result);
        } else {
            console.log(trackedTagsForChannel);
            console.log(trackingChannelsForTag);

            let result = '**Clans tracked in this channel:**\n\n';
            let i = 0;

            if (trackedTagsForChannel.has(interaction.channel.id)) {
                for (const tag of trackedTagsForChannel.get(interaction.channel.id)) {
                    const clan = await clientCOC.getClan(tag);

                    console.log('tag = ' + tag);
                    console.log('channel = ' + interaction.channel.id);

                    ++i;
                    result += i + '. ' + clan.name + ' (' + clan.tag + ')\n';
                }
            }

            interaction.editReply(result);
        }
    },
};