//most improtant discord ids
const botId = '996091928703684641';
const riqId = '239098896972775424';
//xd
const fluxxy = false;
//privileged users
const better_users = [
    riqId               //riq
];
//users
const users = []; 


const { Client, PollingClient } = require('clashofclans.js');
const { createInflate } = require('zlib');
const clientCOC = new Client();
const pollclientCOC = new PollingClient({keys: process.env.APITOKEN});

//logging in to clash api client
clientCOC.setKeys(process.env.APITOKEN);
//clientCOC.login({email: process.env.EMAIL, password: process.env.PASSWORD});

const trackedTagsForChannel = new Map();
const trackingChannelsForTag = new Map();
function clanWarsTrackedInChannel(tag, id) {
    if (!trackedTagsForChannel.has(id)) {
        return false;
    }

    return trackedTagsForChannel.get(id).includes(tag);
}
function channelTrackingClanWars(id, tag) {
    if (!trackingChannelsForTag.has(tag)) {
        return false;
    }

    return trackingChannelsForTag.get(tag).has(id);
}
function addClanWarsTrackingToChannel(tag, id) {
    if (!trackedTagsForChannel.has(id)) {
        trackedTagsForChannel.set(id, [tag]);
        return;
    }

    const arrayOfTags = trackedTagsForChannel.get(id);
    arrayOfTags.push(tag);
    trackedTagsForChannel.set(id, arrayOfTags);
}
function addChannelTrackerToTag(id, tag) {
    if (!trackingChannelsForTag.has(tag)) {
        trackingChannelsForTag.set(tag, [id]);
        return;
    }

    const arrayOfChannels = trackingChannelsForTag.get(tag);
    arrayOfChannels.push(id);
    trackingChannelsForTag.set(tag, arrayOfChannels);
}
function deleteClanWarsTrackingFromChannel(tag, id) {
    if (!trackedTagsForChannel.has(id)) {
        return;
    }

    const arrayOfTags = trackedTagsForChannel.get(id);
    const newArrayOfTags = [];

    for (const arrTag of arrayOfTags) {
        if (arrTag !== tag) {
            newArrayOfTags.push(arrTag);
        }
    }

    if (newArrayOfTags.length > 0) {
        trackedTagsForChannel.set(id, newArrayOfTags);
    } else {
        trackedTagsForChannel.delete(id);
    }
}
function deleteChannelTrackerToTag(id, tag) {
    if (!trackingChannelsForTag.has(tag)) {
        return;
    }

    const arrayOfChannels = trackingChannelsForTag.get(tag);
    const newArrayOfChannels = [];

    for (const arrChannel of arrayOfChannels) {
        if (arrChannel !== id) {
            newArrayOfChannels.push(arrChannel);
        }
    }

    if (newArrayOfChannels.length > 0) {
        trackingChannelsForTag.set(tag, newArrayOfChannels);
    } else {
        trackingChannelsForTag.delete(tag);
    }
}
function startTracking(tag, channelId) {
    pollclientCOC.addWars(tag);
    addClanWarsTrackingToChannel(tag, channelId);
    addChannelTrackerToTag(channelId, tag);
}
function stopTracking(tag, channelId) {
    pollclientCOC.deleteWars(tag);
    deleteClanWarsTrackingFromChannel(tag, channelId);
    deleteChannelTrackerToTag(channelId, tag);
}

function isUser(id) {
    return better_users.includes(id) || users.includes(id);
}
function isBetterUser(id) {
    return better_users.includes(id);
}
function extractId(msg) { //returns [id, rest of msg]
    let len = msg.length;

    //console.log('TO EXTRACT: ' + msg);

    if (len > 0 && '0' <= msg.charAt(0) && msg.charAt(0) <= '9') {
        for (i = 0; i < len; ++i) {
            if (msg.charAt(i) < '0' || '9' < msg.charAt(i)) {
                return [msg.substring(0, i), msg.substr(i, len)];
            }
        }

        return [msg, ''];
    } else if (len > 3 && msg.charAt(0) == '<' && msg.charAt(1) == '@') {
        for (i = 2; i < len; ++i) {
            if (msg.charAt(i) == '>') {
                if (i + 1 < len) {
                    return [msg.substring(2, i), msg.substring(i + 1, len)];
                } else {
                    return [msg.substring(2, i), ''];
                }
            }
        }

        return [msg, ''];
    }

    return [msg, ''];
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function toMinutesAndSecondsString(seconds, approximation) {
    let minutes = 0;

    while (seconds >= 60) {
        ++minutes;
        seconds -= 60;
    }

    return minutes + 'm ' + seconds.toFixed(approximation) + 's';
}
function getWarStatisticsString(warStats) {
    let result = '';
                
    function compareMapPosition(a, b) {
        if (a.mapPosition < b.mapPosition) return -1;
        if (a.mapPosition > b.mapPosition) return 1;
        return 0;
    }

    let members = warStats.clan.members;
    members.sort(compareMapPosition);
    result += '**' +
        warStats.clan.name + ' (' +
        warStats.clan.stars + '\\* ' +
        warStats.clan.destruction + '% ' +
        toMinutesAndSecondsString(warStats.clan.averageAttackDuration, 2) + ')** (' +
        warStats.clan.tag + ')\n';
    for (i = 0; i < members.length; ++i) {
        result += '' + (i + 1) + '. ' + members[i].name + ' (';
        const noOfAttacks = members[i].attacks.length;

        for (j = 0; j < noOfAttacks; ++j) {
            result += (j == 1 ? '; ' : '') +
            //(members[i].attacks[j].stars == 1 ? '<:Juanstar:945677543921553448>' : members[i].attacks[j].stars + '* ') +
            members[i].attacks[j].stars + '\\* ' +
            members[i].attacks[j].destruction + '% ' +
            toMinutesAndSecondsString(members[i].attacks[j].duration, 0);
            
        }

        result += ')\n';
    }

    members = warStats.opponent.members;
    members.sort(compareMapPosition);
    result += '\n**' +
        warStats.opponent.name + ' (' +
        warStats.opponent.stars + '\\* ' +
        warStats.opponent.destruction + '% ' +
        toMinutesAndSecondsString(warStats.opponent.averageAttackDuration, 1) + ')** (' +
        warStats.opponent.tag + ')\n';
    for (i = 0; i < members.length; ++i) {
        result += '' + (i + 1) + '. ' + members[i].name + ' (';
        const noOfAttacks = members[i].attacks.length;

        for (j = 0; j < noOfAttacks; ++j) {
            result += (j == 1 ? '; ' : '') +
            //(members[i].attacks[j].stars == 1 ? '<:Juanstar:945677543921553448>' : members[i].attacks[j].stars + '* ') +
            members[i].attacks[j].stars + '\\* ' +
            members[i].attacks[j].destruction + '% ' +
            toMinutesAndSecondsString(members[i].attacks[j].duration, 0);
            
        }

        result += ')\n';
    }

    return result;
}
function getWinner(warStats) { //1 - clan, -1 - opponent, 0 - perfect tie
    if (warStats.clan.stars > warStats.opponent.stars) return 1;
    if (warStats.clan.stars < warStats.opponent.stars) return -1;
    if (warStats.clan.destruction > warStats.opponent.destruction) return 1;
    if (warStats.clan.destruction < warStats.opponent.destruction) return -1;
    if (warStats.clan.averageAttackDuration < warStats.opponent.averageAttackDuration) return 1;
    if (warStats.clan.averageAttackDuration > warStats.opponent.averageAttackDuration) return -1;
    return 0;
}
function getClansFromThisGuild(guildId) {
    console.log('Get clans from file for guild ' + guildId);

    let check = false;
    let result = new Map();

    const fs = require('fs');
    fs.open('./tags/' + guildId + '.txt', "a+", function(err, f) {
        console.log('File opened.');
    });
    const data = fs.readFileSync('./tags/' + guildId + '.txt',{encoding:'utf8', flag:'r'});

    const lines = data.split('\n');
    
    for (line of lines) {
        if (line.length < 3) {
            continue;
        }
        const vals = line.split(' ');
        result.set(vals[0], vals.slice(1));
    }

    return result;
}
function writeToGuildFile(guildId, channelTagsMap) {
    const fs = require('fs');
    let content = '';

    for (let [key, value] of channelTagsMap) {
        content += key;

        for (tag of value) {
            content += ' ' + tag;
        }
        content += '\n';
    }

    try {
        fs.writeFileSync('./tags/' + guildId + '.txt', content);
        // file written successfully
    } catch (err) {
        console.error(err);
    }
}

module.exports = { 
    botId, riqId, fluxxy, better_users, users,
    clientCOC, pollclientCOC,
    trackedTagsForChannel, trackingChannelsForTag,
    clanWarsTrackedInChannel,
    channelTrackingClanWars,
    addClanWarsTrackingToChannel,
    addChannelTrackerToTag,
    deleteClanWarsTrackingFromChannel,
    deleteChannelTrackerToTag,
    startTracking,
    stopTracking,
    isUser,
    isBetterUser,
    extractId,
    sleep,
    toMinutesAndSecondsString,
    getWarStatisticsString,
    getWinner,
    getClansFromThisGuild,
    writeToGuildFile}