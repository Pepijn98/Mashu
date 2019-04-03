const Command = require("../../Command");

class Ping extends Command {
    constructor(category) {
        super({
            name: "ping",
            description: "Testing the bot",
            usage: "ping",
            category: category
        });
    }

    async run(msg) {
        await msg.channel.createMessage("Pong!");
    }
}

module.exports = Ping;
