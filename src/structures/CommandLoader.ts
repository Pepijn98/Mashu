import Command from "../Command";
import Logger from "../utils/Logger";
import Collection from "@kurozero/collection";
import { promises as fs } from "fs";

export default class CommandLoader {
    public commands: Collection<Command>;
    public logger: Logger;

    public constructor(logger: Logger) {
        this.commands = new Collection(Command);
        this.logger = logger;
    }

    /** Load all the commands */
    public async load(commandDir: string): Promise<Collection<Command>> {
        const dirs = await fs.readdir(commandDir);
        for (const dir of dirs) {
            const files = await fs.readdir(`${commandDir}/${dir}`);
            for (const file of files) {
                if (file.endsWith(".ts")) {
                    await this._add(`${commandDir}/${dir}/${file}`, dir);
                }
            }
        }
        return this.commands;
    }

    private async _add(commandPath: string, category: string): Promise<void> {
        try {
            const cmd = await import(commandPath);
            const command: Command = new cmd.default(category);

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
