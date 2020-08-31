import path from "path";
import Mashu from "./MashuClient";
import Logger from "~/utils/Logger";
import Event from "~/types/IEvent";
import { promises as fs } from "fs";

export default class EventLoader {
    #client: Mashu;
    #logger: Logger;

    constructor(client: Mashu) {
        this.#client = client;
        this.#logger = client.logger;
    }

    /** Load all the commands */
    async load(dir: string): Promise<void> {
        const files = await fs.readdir(dir);
        for (const file of files) {
            if (/\.(t|j)s$/iu.test(file)) {
                const event = new (await import(path.join(dir, file))).default() as Event;
                this.#logger.info("EVENTS", `Loaded even ${event.name}`);
                this.#client.on(event.name, (...args: any[]) => event.run(this.#client, ...args));
            }
        }
    }
}
