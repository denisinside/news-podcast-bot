import { Scenes } from "telegraf";

export interface SessionData extends Scenes.SceneSessionData {
}

export interface IBotContext extends Scenes.SceneContext<SessionData> {}
