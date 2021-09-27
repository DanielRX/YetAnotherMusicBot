import type {CustomInteraction} from '../../utils/types';

export const name = 'ping';
export const description = 'Replies with Pong!';

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    return interaction.reply('Pong!');
};
