import type {CommandInput, CommandReturn, SpeedrunnerStats, SpeedrunStats} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {fetchJSON} from '../../utils/utils';
import prettyMilliseconds from 'pretty-ms';

export const name = 'speedrunner-stats';
export const description = 'Show off your splits from Splits.io';
export const deferred = true;

export const options = [
    {type: 'string' as const, name: 'user', description: 'Who do you want to look up?', required: true, choices: []},
];

const embedColour = '#3E8657';

export const execute = async({params: {user}, messages}: CommandInput<{user: string}>): Promise<CommandReturn> => {
    const userFiltered = user.toLowerCase();
    const userRes = await fetchJSON<SpeedrunStats>(`https://splits.io/api/v4/runners?search=${userFiltered}`);
    const runnerCount = userRes.runners.length;
    if(runnerCount == 0) { return `:x: The Runner ${user} was not found.`; }
    if(userRes.status == 404) { return `:x: The Runner ${user} was not found.`; }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const pbsRes = await fetchJSON<SpeedrunnerStats>(`https://splits.io/api/v4/runners/${userRes.runners[0].name}/pbs`);

    if(pbsRes.length == 0) { return `:x: The Runner ${userRes.runners[0].name}'s hasn't submitted any speedruns to Splits.io\n\n        Please try again later.`; }
    if(pbsRes.status == 404) { return `:x: The User ${user}s stats were not found.`; }
    if(runnerCount == 0) { return 'There we no runners found'; }
    const pbArray = pbsRes.pbs;
    const pbEmbedArray = [];

    for(let i = 1; i <= pbArray.length; ++i) {
        const pbs = pbArray[i - 1];
        pbEmbedArray.push(new MessageEmbed()
            .setTitle(`Entry #${i} of ${pbArray.length}`)
            .setURL('https://splits.io/' + pbs.id)
            .setAuthor(`${userRes.runners[0].name}'s Speedrun Stats`, userRes.runners[0].avatar)
            .setThumbnail(pbs.game.cover_url)
            .addField('Game', pbs.game.name, true)
            .addField(`Category`, pbs.category.name, true)
            .addField('Number of Segments', pbs.segments.length.toString(), true)
            .addField('Finish Time', prettyMilliseconds(pbs.realtime_duration_ms), true)
            .addField('Sum Of Best', prettyMilliseconds(pbs.realtime_sum_of_best_ms), true)
            .addField('Attempts', pbs.attempts.toString(), true)
            .addField('Timer Used', pbs.program)
            .setFooter(`${messages.POWERED_BY()} Splits.io! Run was submitted`, 'https://splits.io//assets/favicon/favicon-32x32-84a395f64a39ce95d7c51fecffdaa578e2277e340d47a50fdac7feb00bf3fd68.png')
            .setTimestamp(pbs.parsed_at));
    }

    const pageData = {pages: pbEmbedArray, color: embedColour};
    return {pages: pageData};
};

