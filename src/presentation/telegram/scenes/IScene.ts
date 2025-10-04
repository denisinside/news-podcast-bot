import { Scenes } from "telegraf";
import { IBotContext } from "../../../context/IBotContext";

export interface IScene {
    name: string;
    getScene(): Scenes.BaseScene<IBotContext>;
}
