const fs = require("fs").promises;
const Command = require("../Command");
const { Collection } = require("eris");

class CommandLoader {
    constructor(logger) {
        this.commands = new Collection(Command);
        this.logger = logger;
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
                    this._add(`${commandDir}/${dir}/${file}`, dir);
                }
            }
        }

        return this.commands;
    }

    /** @hidden */
    _add(commandPath, category) {
        try {
            Reflect.deleteProperty(require.cache, require.resolve(commandPath));

            const command = new (require(commandPath))(category);
            if (this.commands.has(command.name)) {
                this.logger.warn("CommandHandler", `A command with the name ${command.name} already exists and has been skipped`);
            } else {
                this.commands.add(command);
            }
        } catch (e) {
            this.logger.warn("CommandHandler", `${commandPath} - ${e.stack}`);
        }
    }
}

module.exports = CommandLoader;
