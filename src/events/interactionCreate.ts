import {commands} from '../utils/client';
import type {CustomInteraction} from '../utils/types';
import {logger} from '../utils/logging';

export const name = 'interactionCreate';

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!interaction.isCommand()) return;

    if(!commands.has(interaction.commandName)) return;

    try {
        logger.verbose({user: interaction.user, command: interaction.commandName});
        const comamand = commands.get(interaction.commandName)!;
        const params: any = [];
        for(const option of comamand.options ?? []) {
            const opt = interaction.options.get(option.name, option.required);
            switch(option.type) {
                case 'boolean': { params.push(Boolean(opt?.value ?? option.default)); break; }
                case 'string': { params.push(`${opt?.value ?? option.default}`); break; }
                case 'integer': { params.push(Number(opt?.value ?? option.default)); break; }
                case 'user': { params.push(opt?.user ?? option.default); break; }
            }
        }
        logger.verbose(params);
        await commands.get(interaction.commandName)?.execute(interaction, ...params);
    } catch(e: unknown) {
        logger.error(e);
        return interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
    }
};
