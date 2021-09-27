import type {CustomInteraction} from '../../utils/types';

export const name = 'about';
export const description = 'Info about the bot and its creator!';

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    return interaction.reply('Made by @DanielRX#6669 with :heart: code is available on GitHub (coming soon)');
};
