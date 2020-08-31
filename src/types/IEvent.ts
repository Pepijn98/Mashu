import Mashu from "~/utils/MashuClient";

export interface IEvent {
    name: string;
    run: (client: Mashu, ...args: any[]) => Promise<void>;
}

export default IEvent;
