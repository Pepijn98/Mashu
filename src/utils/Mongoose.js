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

const SuggestionSchema = new mongoose.Schema({
    "id": Number,
    "creator": String,
    "creatorId": String,
    "moderator": String,
    "modId": String,
    "state": { "default": "created", "type": String },
    "content": String,
    "notificationId": String
});

const GuildSchema = new mongoose.Schema({
    "id": String,
    "logChannel": String,
    "suggestionChannel": String,
    "notifyCreator": { "default": false, "type": Boolean },
    "muteRole": String,
    "users": [User],
    "suggestions": [SuggestionSchema]
});

const GuildModel = mongoose.model("Guild", GuildSchema);

module.exports = GuildModel;
