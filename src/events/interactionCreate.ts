import {commands} from '../utils/client';
import type {CustomInteraction} from '../utils/types';

export const name = 'interactionCreate';

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!interaction.isCommand()) return;

    if(!commands.has(interaction.commandName)) return;

    try {
        await commands.get(interaction.commandName)?.execute(interaction);
    } catch(e: unknown) {
        console.error(e);
        return interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
    }
};
