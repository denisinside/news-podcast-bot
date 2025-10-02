import { IBotContext } from "../../../context/IBotContext";

export interface ICommand {
    name: string;
    execute(ctx: IBotContext): Promise<void>;
}