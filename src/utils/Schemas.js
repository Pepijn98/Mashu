const mongoose = require("mongoose");

const Violation = new mongoose.Schema({
    "id": String,
    "timestamp": String,
    "by": String,
    "reason": String
});

const Note = new mongoose.Schema({
    "id": String,
    "timestamp": String,
    "by": String,
    "message": String
});

const User = new mongoose.Schema({
    "id": String,
    "isBanned": Boolean,
    "isMuted": Boolean,
    "warns": [Violation],
    "bans": [Violation],
    "kicks": [Violation],
    "notes": [Note]
});

const GuildSchema = new mongoose.Schema({
    "id": String,
    "logChannel": String,
    "muteRole": String,
    "users": [User]
});

const GuildModel = mongoose.model("Guild", GuildSchema);

module.exports = GuildModel;
