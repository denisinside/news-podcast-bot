import { Scenes } from "telegraf";

export interface SessionData extends Scenes.SceneSessionData {
    key?: string;
    topicId?: string;
}

export interface IBotContext extends Scenes.SceneContext<SessionData> {}
