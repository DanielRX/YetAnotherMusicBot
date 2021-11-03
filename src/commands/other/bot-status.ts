import type {CommandInput, CommandReturn} from '../../utils/types';
import type {Message, User} from 'discord.js';
import Discord from 'discord.js';
import os from 'os';
import {readJsonSync} from 'fs-extra';
import {commands} from '../../utils/client';
const pkg = readJsonSync('./package.json');

export const name = 'bot-status';
export const description = 'Shows the current system status';
export const deferred = false;

const embedColour = '#ff0000';

export const execute = async({interaction}: CommandInput): Promise<CommandReturn> => {
    const owner = await interaction.guild.fetchOwner();
    const isOwner = owner.id == interaction.member.id ? true : false;

    const pingMsg = await interaction.channel?.send('Processing...') as unknown as Message;

    const commandTotal = commands.size;
    const platform = os
        .platform()
        .replace(/win32/, 'Windows')
        .replace(/darwin/, 'MacOS')
        .replace(/linux/, 'Linux');
    const archInfo = os.arch();
    const libList = JSON.stringify(pkg.dependencies)
        .replace(/,/g, '\n')
        .replace(/"/g, '')
        .replace(/{/g, '')
        .replace(/}/g, '')
        .replace(/\^/g, '')
        .replace(/github\:discordjs\/discord.js#master/, `${Discord.version}`)
        .replace(/:/g, ': ');

    const used = process.memoryUsage().heapUsed / 1024 / 1024;

    const totalSeconds = process.uptime();
    const realTotalSecs = Math.floor(totalSeconds % 60);
    const days = Math.floor((totalSeconds % 31536000) / 86400);
    const hours = Math.floor((totalSeconds / 3600) % 24);
    const mins = Math.floor((totalSeconds / 60) % 60);

    const guildCacheMap = interaction.client.guilds.cache;
    const guildCacheArray = Array.from(guildCacheMap, ([key, value]) => ({name: key, value}));
    const memberCount = guildCacheArray.reduce((prev, curr) => prev + curr.value.memberCount, 0);

    await pingMsg.edit('Complete');
    const user = interaction.client.user as User;
    const statusEmbed = new Discord.MessageEmbed()
        .setThumbnail(user.displayAvatarURL() || '')
        .setTitle(`Status of ${interaction.client.user?.username}`)
        .setColor(embedColour);

    if(isOwner) {
        statusEmbed.addField(`Memory Usage`, `${Math.round(used * 100) / 100}MB`, true).addField(`Platform`, `${platform} ${archInfo}`, true);
    }

    statusEmbed.addField('Ping', `Round-trip took ${(pingMsg.editedTimestamp ?? pingMsg.createdTimestamp) - interaction.createdTimestamp}ms. \n			${interaction.client.ws.ping ? `The heartbeat ping is ${Math.round(interaction.client.ws.ping)}ms.` : ''}`)
        .addField(`Uptime`, `${days} D ${hours} H : ${mins} M : ${realTotalSecs} S`)
        .addField('Available Commands', `${commandTotal} Commands Available`)
        .addField('Servers, Users', `On ${interaction.client.guilds.cache.size} servers, with a total of ${memberCount} users.`)
        .setFooter('Created', user.avatarURL() ?? '')
        .setTimestamp(user.createdAt);

    if(isOwner) { statusEmbed.addField('Dependency List', `node: ${process.version.replace(/v/, '')}\n        ${libList}`); }

    await pingMsg.delete();
    return {embeds: [statusEmbed]};
};

