// @ts-check

import mongoose from 'mongoose';
import type {Track} from '../types';

type MemberT = {memberId: string, username: string, joinedAt: Date, savedPlaylist: Track[]}

const schema = new mongoose.Schema<MemberT>({
    memberId: String,
    username: String,
    joinedAt: Date,
    savedPlaylists: Array
});

const Member = mongoose.model('Member', schema);

export default Member;
