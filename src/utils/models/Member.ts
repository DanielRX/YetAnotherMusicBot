import mongoose from 'mongoose';
import type {Playlist} from '../types';

type MemberT = {memberId: string, username: string, joinedAt: Date, savedPlaylists: Playlist[]}

const schema = new mongoose.Schema<MemberT>({
    memberId: String,
    username: String,
    joinedAt: Date,
    savedPlaylists: Array
});

const Member = mongoose.model<MemberT>('Member', schema);

export default Member;
