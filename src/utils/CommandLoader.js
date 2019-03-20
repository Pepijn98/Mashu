const fs = require("fs").promises;
const Command = require("../Command");
const { Collection } = require("eris");

class CommandLoader {
    constructor() {
        this.commands = new Collection(Command);
    }

    /**
     * Load all the commands
     *
     * @param {string} commandDir
     * @returns {Collection<Command>}
     */
    async load(commandDir) {
        const dirs = await fs.readdir(commandDir);

        for (const dir of dirs) {
            const files = await fs.readdir(`${commandDir}/${dir}`);

            for (const file of files) {
                if (file.endsWith(".js")) {
                    this.add(`${commandDir}/${dir}/${file}`);
                }
            }
        }

        return this.commands;
    }

    add(commandPath) {
        try {
            Reflect.deleteProperty(require.cache, require.resolve(commandPath));

            const command = new (require(commandPath))();
            if (this.commands.has(command.name)) {
                console.warn(`A command with the name ${command.name} already exists and has been skipped`);
            } else {
                this.commands.add(command);
            }
        } catch (e) {
            console.warn(`${commandPath} - ${e.stack}`);
        }
    }
}

module.exports = CommandLoader;
