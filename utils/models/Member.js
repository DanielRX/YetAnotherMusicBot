// @ts-check

const mongoose = require('mongoose');

/**
 * @typedef MemberT
 * @type {{memberId: string, username: string, joinedAt: Date, savedPlaylist: import('../..').Track[]}}
 */

/**
 * @type {mongoose.Schema<MemberT>}
 */
const schema = new mongoose.Schema({
    memberId: String,
    username: String,
    joinedAt: Date,
    savedPlaylists: Array
});

/**
 * @type {mongoose.Model<MemberT>}
 */
const Member = mongoose.model('Member', schema);

module.exports = Member;
