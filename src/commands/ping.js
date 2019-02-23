const Command = require("../Command");

class Ping extends Command {
    constructor() {
        super({
            name: "ping",
            description: "Testing the bot",
            usage: "ping",
            guildOnly: true,
            ownerOnly: true,
            userPermissions: ["sendMessages"],
            botPermissions: ["readMessages", "sendMessages"]
        });
    }

    async run(msg) {
        await msg.channel.createMessage("Pong!");
    }
}

module.exports = Ping;
