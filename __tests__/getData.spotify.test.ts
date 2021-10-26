import {getData} from 'spotify-url-info';

it('should return data from spotify', () => {
    return void getData('https://open.spotify.com/track/4fzsfWzRhPawzqhX8Qt9F3?si=c7359b61c4404fdb').then((data: {name: string, artists: ({name: string})[]}) => {
        expect(data.artists[0].name).toBe('Kanye West');
        expect(data.name).toBe('Stronger');
    });
});
