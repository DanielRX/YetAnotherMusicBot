import type {CommandInput, CommandReturn} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {fetch} from '../../utils/utils';
import prettyMilliseconds from 'pretty-ms';

export const name = 'speedrunner-stats';
export const description = 'Show off your splits from Splits.io';
export const deferred = true;

export const options = [
    {type: 'string' as const, name: 'user', description: 'Who do you want to look up?', required: true, choices: []},
];

export const execute = async({interaction, params: {user}}: CommandInput<{user: string}>): Promise<CommandReturn> => {
    const userFiltered = user.toLowerCase();
    const userRes = await fetch<{runners: ({name: string, avatar: string})[], status :number}>(`https://splits.io/api/v4/runners?search=${userFiltered}`).then(async(res) => res.json());
    const runnerCount = userRes.runners.length;
    if(runnerCount == 0) {
        return `:x: The Runner ${user} was not found.`;
    }

    if(userRes.status == 404) {
        return `:x: The Runner ${user} was not found.`;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const pbsRes = await fetch<{pbs: ({id: string, realtime_duration_ms: number, realtime_sum_of_best_ms: number, program: string, parsed_at: number, attempts: any[], game: {cover_url: string, name: string}, category: {name: string}, segments: any[]})[], status :number}>(`https://splits.io/api/v4/runners/${userRes.runners[0].name}/pbs`).then(async(res) => res.json());

    if(pbsRes.length == 0) { return interaction.followUp(`:x: The Runner ${userRes.runners[0].name}'s hasn't submitted any speedruns to Splits.io\n\n        Please try again later.`); }
    if(pbsRes.status == 404) { return `:x: The User ${user}s stats were not found.`; }

    if(runnerCount != 0) {
        const pbArray = pbsRes.pbs;
        const pbEmbedArray = [];

        for(let i = 1; i <= pbsRes.pbs.length; ++i) {
            pbEmbedArray.push(new MessageEmbed()
                .setTitle(`Entry #${i} of ${pbsRes.pbs.length}`)
                .setURL('https://splits.io/' + pbArray[i - 1].id)
                .setAuthor(`${userRes.runners[0].name}'s Speedrun Stats`, userRes.runners[0].avatar)
                .setThumbnail(pbArray[i - 1].game.cover_url)
                .addField('Game', pbArray[i - 1].game.name, true)
                .addField(`Category`, pbArray[i - 1].category.name, true)
                .addField('Number of Segments', pbArray[i - 1].segments.length.toString(), true)
                .addField('Finish Time', prettyMilliseconds(pbArray[i - 1].realtime_duration_ms), true)
                .addField('Sum Of Best', prettyMilliseconds(pbArray[i - 1].realtime_sum_of_best_ms), true)
                .addField('Attempts', pbArray[i - 1].attempts.toString(), true)
                .addField('Timer Used', pbArray[i - 1].program)
                .setFooter('Powered by Splits.io! Run was submitted', 'https://splits.io//assets/favicon/favicon-32x32-84a395f64a39ce95d7c51fecffdaa578e2277e340d47a50fdac7feb00bf3fd68.png')
                .setTimestamp(pbArray[i - 1].parsed_at));
        }

        const pageData = {pages: pbEmbedArray, color: '#3E8657' as const};
        return {pages: pageData};
    }
    return 'There we no runners found';
};

