import Logger from "~/utils/Logger";
import Mashu from "~/utils/MashuClient";

export interface ICommandContext {
    client: Mashu;
    logger: Logger;
}
