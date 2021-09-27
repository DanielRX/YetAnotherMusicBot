import mongoose from 'mongoose';
import type {PlayTrack} from '../types';

type MemberT = {memberId: string, username: string, joinedAt: Date, savedPlaylists: ({name: string, urls: PlayTrack[]})[]}

const schema = new mongoose.Schema<MemberT>({
    memberId: String,
    username: String,
    joinedAt: Date,
    savedPlaylists: Array
});

const Member = mongoose.model<MemberT>('Member', schema);

export default Member;
