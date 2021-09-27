import {searchOne} from '../src/utils/music/searchOne';

const mockData = {artists: [{name: 'Kanye West', type: 'artist'}], name: 'Stronger'};

it('should return data', () => {
    return void searchOne(mockData).then((video) => {
        expect(video).toHaveProperty('title');
        expect(video).toHaveProperty('url');
        expect(video).toHaveProperty('thumbnail');
        expect(video).toHaveProperty('durationFormatted');
        expect(video).toHaveProperty('duration');
    });
});
