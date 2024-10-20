require('dotenv').config(); //to start process from .env file
const Discord = require('discord.js');

//preparing things for slash commands
const fs = require('node:fs');
const path = require('node:path');

//starting discord bot
const clientDC = new Discord.Client({ 
    intents: [
        Discord.GatewayIntentBits.DirectMessages, 
        Discord.GatewayIntentBits.Guilds, 
        Discord.GatewayIntentBits.GuildMessages],
    partials: ['MESSAGE', 'CHANNEL']});
clientDC.once('ready', () =>{
    console.log('BOT IS ONLINE'); //message when bot is online
})
clientDC.commands = new Discord.Collection();
//logging in to discord client
clientDC.login(process.env.TOKEN);

const { clientCOC, pollclientCOC, botId, riqId, fluxxy, better_users, users, 
        trackingChannelsForTag, trackedTagsForChannel, isUser, isBetterUser,
        getWinner, getWarStatisticsString, toMinutesAndSecondsString, } = require('./utils.js');

//reading slash commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

pollclientCOC.setWarEvent({
    name: 'warUpdate',
    filter: (oldWar, newWar) => {
        if (newWar.state === 'notInWar') {
            return false;
        }
        if (oldWar.state === 'notInWar') {
            return false;
        }
        return oldWar.state !== newWar.state ||
               oldWar.clan.attackCount !== newWar.clan.attackCount ||
               oldWar.opponent.attackCount !== newWar.opponent.attackCount;
    }
});
pollclientCOC.on('warUpdate', (oldWar, newWar) => {
    console.log('WAR UPDATE');

    let result = '';

    if (oldWar.state !== 'preparation' && newWar.state === 'preparation') {
        console.log('PREP STARTED');
        result += '**Preparation time started!**\n\n';

        result += getWarStatisticsString(newWar);
    } else if (oldWar.state !== 'inWar' && newWar.state === 'inWar') {
        console.log('WAR STARTED');
        result += '**War started!**\n\n';

        result += getWarStatisticsString(newWar);
    } else if (oldWar.state !== 'warEnded' && newWar.state === 'warEnded') {
        console.log('WAR ENDED');
        let winner = '';

        if (getWinner(newWar) === 1) {
            winner = newWar.clan.name + ' wins!';
        } else if (getWinner(newWar) === -1) {
            winner = newWar.opponent.name + ' wins!';
        } else {
            winner = 'Perfect tie!';
        }

        result += '**War ended! ' + winner + '**\n\n';

        result += getWarStatisticsString(newWar);
    } else {
        console.log('WAR STATS UPDATE');
        const oldClanMembers = oldWar.clan.members;
        const oldOpponentMembers = oldWar.opponent.members;
        const newClanMembers = newWar.clan.members;
        const newOpponentMembers = newWar.opponent.members;
        const newAttacks = [];
        let highestOrder = 0;
        const tagMemberMap = new Map();
        const tagSideMap = new Map();
        
        for (const member of oldClanMembers) {
            tagMemberMap.set(member.tag, member);
            tagSideMap.set(member.tag, 'clan');

            for (const attack of member.attacks) {
                highestOrder = Math.max(highestOrder, attack.order);
            }
        }
        for (const member of oldOpponentMembers) {
            tagMemberMap.set(member.tag, member);
            tagSideMap.set(member.tag, 'opponent');

            for (const attack of member.attacks) {
                highestOrder = Math.max(highestOrder, attack.order);
            }
        }

        for (const member of newClanMembers) {
            for (const attack of member.attacks) {
                if (highestOrder < attack.order) {
                    newAttacks.push(attack);
                }
            }
        }
        for (const member of newOpponentMembers) {
            for (const attack of member.attacks) {
                if (highestOrder < attack.order) {
                    newAttacks.push(attack);
                }
            }
        }

        if (newAttacks.length === 0) {
            return;
        }

        newAttacks.sort((a, b) => {
            if (a.order < b.order) return -1;
            if (a.order > b.order) return 1;
            return 0;
        });

        for (const attack of newAttacks) {
            if (tagSideMap.get(attack.attackerTag) === 'clan') {
                result += '**ATTACK**\n';
            } else {
                result += '**DEFENSE**\n';
            }

            result += '**' + tagMemberMap.get(attack.attackerTag).mapPosition + '. ' + tagMemberMap.get(attack.attackerTag).name +
                ' vs ' + tagMemberMap.get(attack.defenderTag).mapPosition + '. ' + tagMemberMap.get(attack.defenderTag).name + '**' +
                attack.stars + '* ' + attack.destruction + '% ' + toMinutesAndSecondsString(attack.duration) + '\n\n';
        }
    }

    if (!trackingChannelsForTag.has(newWar.clan.tag)) {
        return;
    }

    const ids = trackingChannelsForTag.get(newWar.clan.tag);

    console.log('result = ' + result);
    console.log('tag = ' + newWar.clan.tag);

    for (const channelId of ids) {
        console.log('channelId = ' + channelId);
        clientDC.channels.fetch(channelId)
            .then(channel => {
                console.log('CHANNEL FETCH OK');
                console.log(channel);

                channel.send(result);
            })
            .catch(err => {
                console.log('Channel fetch failed for id ' + channelId);
                console.log(err);
            })
    }

});

(async function () {
    await pollclientCOC.init();
})();

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		clientDC.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}
clientDC.on(Discord.Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});