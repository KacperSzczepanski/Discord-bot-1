const { SlashCommandBuilder } = require('discord.js');
const { 
    clientCOC, trackedTagsForChannel, trackingChannelsForTag,
    isBetterUser, getClansFromThisGuild, writeToGuildFile, clanWarsTrackedInChannel, startTracking } = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('channel_tags')
        .setDescription('Managing tags for channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('save')
                .setDescription('Save tags in channel')
                .addStringOption(option => 
                    option
                        .setName('tags')
                        .setDescription('Tag or tags of clans')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove tags from channel')
                .addStringOption(option => 
                    option
                        .setName('tags')
                        .setDescription('Tag or tags of clans')
                        .setRequired(true)))
        .addSubcommand(subcommand => 
            subcommand
                .setName('list')
                .setDescription('List binded tags'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('load')
                .setDescription('Load tags in every channel')),
    async execute(interaction) {
        await interaction.deferReply();
        if (interaction.options.getSubcommand() === 'save') {
            if (!isBetterUser(interaction.user.id)) {
                interaction.editReply('No permission to use this command.');
                return;
            }

            let result = '';
            const tags = interaction.options.get('tags', true).value.trim().split(',');
    
            console.log('tags = ' + tags);

            let channelId = interaction.channel.id;
            let guildId = interaction.guild.id;
            let channelTagsMap = getClansFromThisGuild(guildId);
            console.log(channelTagsMap);
    
            let tagsToAdd = [];
    
            console.log('channelId = ' + channelId);
    
            for (tag of tags) {
                tag = tag.trim();
                if (channelTagsMap.has(channelId)) {
                    if (channelTagsMap.get(channelId).includes(tag)) {
                        result += 'Clan ' + tag + ' is already binded to this channel.\n';
                        continue;
                    } else {
                        tagsToAdd.push(tag);
                    }
                } else {
                    tagsToAdd.push(tag);
                }
            }
    
            console.log('tags to add:');
            console.log(tagsToAdd);
    
            for (tag of tagsToAdd) {
                if (channelTagsMap.has(channelId)) {
                    const arrayOfTags = channelTagsMap.get(channelId);
                    if (arrayOfTags.includes(tag) === false) {
                        arrayOfTags.push(tag);
                        channelTagsMap.set(channelId, arrayOfTags);
                        result += 'Binding clan ' + tag + ' to this chat.\n';
                    }
                } else {
                    const arrayOfTags = [tag];
                    channelTagsMap.set(channelId, arrayOfTags);
                    result += 'Binding clan ' + tag + ' to this chat.\n';
                }
            }
    
            writeToGuildFile(guildId, channelTagsMap);

            interaction.editReply(result);
        } else if (interaction.options.getSubcommand() === 'remove') {
            if (!isBetterUser(interaction.user.id)) {
                interaction.editReply('No permission to use this command.');
                return;
            }
    
            let result = '';
            const tags = interaction.options.get('tags', true).value.trim().split(',');
    
            console.log('tags = ' + tags);
    
            let channelId = interaction.channel.id;
            let guildId = interaction.guild.id;
            let channelTagsMap = getClansFromThisGuild(guildId);
            console.log(channelTagsMap);
    
            console.log('channelId = ' + channelId);
    
            if (channelTagsMap.has(channelId)) {
                const arrayOfTags = channelTagsMap.get(channelId);
    
                for (tag of tags) {
                    tag = tag.trim();
                    if (arrayOfTags.includes(tag)) {
                        const index = arrayOfTags.indexOf(tag);
                        arrayOfTags.splice(index, 1);

                        result += 'Unbinding ' + tag + ' from this channel.\n';
                    } else {
                        result += 'Tag ' + tag + ' is not binded to this chat.\n';
                    }
                }
    
                writeToGuildFile(guildId, channelTagsMap);
            } else {
                result += 'This channel doesn\'t have any binded tags.\n';
            }

            interaction.editReply(result);
        } else if (interaction.options.getSubcommand() === 'list') {
            let result = 'Tags binded to this channel:\n\n';

            let channelId = interaction.channel.id;
            let guildId = interaction.guild.id;
            let channelTagsMap = getClansFromThisGuild(guildId);
            console.log(channelTagsMap);

            if (channelTagsMap.has(channelId)) {
                const arrayOfTags = channelTagsMap.get(channelId);
                let i = 0;
                for (tag of arrayOfTags) {
                    i++;
                    result += i + '. ' + tag + '\n';
                }
            }

            interaction.editReply(result);
        } else {
            const guildId = interaction.guild.id;
            const channelTagsMap = getClansFromThisGuild(guildId);

            for (let [channelId, tags] of channelTagsMap) {
                console.log('channelId = ' + channelId);
                interaction.options.client.channels.fetch(channelId)
                    .then(channel => {
                        for (tag of tags) {
                            let response = clientCOC.getClan(tag);
                            response
                                .then(clan => {
                                    if (!clanWarsTrackedInChannel(clan.tag, channel.id)) {
                                        //clientCOC.events.addWars(clan.tag);
                                        //addClanWarsTrackingToChannel(clan.tag, channel.id);
                                        //addChannelTrackerToTag(channel.id, clan.tag);
                                        startTracking(clan.tag, channel.id);

                                        channel.send('Clan ' + clan.name + ' (' + clan.tag + ') added to tracking.');
                                    }
                                })
                                .catch(err => {
                                    console.log(err);
                                    channel.send('Clan ' + tag + ' not found.');
                                })
                        }
                    })
                    .catch(err => {
                        console.log('Channel fetch failed for id ' + channelId);
                        console.log(err);
                    })
            }

            interaction.editReply('Loading tags.');
        }
    },
};