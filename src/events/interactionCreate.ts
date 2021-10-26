import {commands} from '../utils/client';
import type {CustomInteraction} from '../utils/types';
import {logger} from '../utils/logging';
import {PagesBuilder} from 'discord.js-pages';
import type {ColorResolvable} from 'discord.js';
import {messages} from '../utils/messages';
import {camelCase} from 'change-case';

export const name = 'interactionCreate';

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!interaction.isCommand()) return;

    if(!commands.has(interaction.commandName)) return;

    try {
        logger.verbose({user: interaction.user, command: interaction.commandName});
        const command = commands.get(interaction.commandName)!;
        const params: any = {};
        for(const option of command.options ?? []) {
            const opt = interaction.options.get(option.name, option.required);
            switch(option.type) {
                case 'boolean': { params[camelCase(option.name)] = (Boolean(opt?.value ?? option.default)); break; }
                case 'string': { params[camelCase(option.name)] = (`${opt?.value ?? option.default}`); break; }
                case 'integer': { params[camelCase(option.name)] = (Number(opt?.value ?? option.default)); break; }
                case 'user': { params[camelCase(option.name)] = (opt?.user ?? option.default); break; }
            }
        }
        logger.verbose(params);
        if(command.deferred) {
            await interaction.deferReply();
        }
        const output = await command.execute({interaction, messages: await messages('en_gb'), params, guildId: interaction.guildId});
        if(!interaction.replied) {
            if(typeof output !== 'undefined') {
                if(typeof output !== 'string' && 'pages' in output) {
                    const pagesData = output.pages;
                    const pages = new PagesBuilder(interaction).setPages(pagesData.pages);
                    if(typeof pagesData.title !== 'undefined') { pages.setTitle(pagesData.title); }
                    if(typeof pagesData.color !== 'undefined') { pages.setColor(pagesData.color as unknown as ColorResolvable); }
                    if(typeof pagesData.url !== 'undefined') { pages.setURL(pagesData.url); }
                    if(typeof pagesData.thumbnail !== 'undefined') { pages.setThumbnail(pagesData.thumbnail); }
                    if(typeof pagesData.author !== 'undefined') { pages.setAuthor(pagesData.author.username, pagesData.author.avatar); }
                    await pages.build();
                } else if(interaction.deferred) {
                    await interaction.followUp(output);
                } else {
                    await interaction.reply(output);
                }
            }
        }
    } catch(e: unknown) {
        logger.error(e);
        if(!interaction.replied) {
            if(interaction.deferred) {
                await interaction.followUp({content: 'There was an error while executing this command!', ephemeral: true});
            } else {
                await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
            }
        }
    }
};
