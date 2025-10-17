import { IScene } from "./IScene";
import { BaseScene } from "telegraf/scenes";
import { IBotContext } from "../../../context/IBotContext";
import { Markup, Scenes } from "telegraf";
import { IUserSettingsService } from "../../../application/interfaces/IUserSettingsService";
import { NewsFrequency } from "../../../models/UserSettings";

export class SettingsScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "settings";

    constructor(
        private readonly userSettingsService: IUserSettingsService
    ) {
        this.scene = new Scenes.BaseScene<IBotContext>(this.name);
        this.registerHandlers();
    }

    getScene(): BaseScene<IBotContext> {
        return this.scene;
    }

    private getFrequencyText(frequency: NewsFrequency): string {
        const frequencyMap: Record<NewsFrequency, string> = {
            [NewsFrequency.HOURLY]: "Щогодини ⏰",
            [NewsFrequency.EVERY_3_HOURS]: "Кожні 3 години 🕒",
            [NewsFrequency.TWICE_DAILY]: "Двічі на день 🌅🌙",
            [NewsFrequency.DAILY]: "Раз на день 📅",
            [NewsFrequency.DISABLED]: "Вимкнено ⏸️"
        };
        return frequencyMap[frequency] || frequency;
    }

    private async showMainSettings(ctx: any) {
        const userId = ctx.from!.id;
        const settings = await this.userSettingsService.getUserSettings(userId);

        if (!settings) {
            await ctx.reply("❌ Помилка завантаження налаштувань");
            return;
        }

        const frequencyText = this.getFrequencyText(settings.newsFrequency);
        const audioText = settings.enableAudioPodcasts ? "Увімкнено ✅" : "Вимкнено ❌";

        await ctx.reply(
            "⚙️ *Налаштування*\n\n" +
            "*Ваші поточні налаштування:*\n\n" +
            `📰 *Частота новин:* ${frequencyText}\n` +
            `🎧 *Аудіо подкасти:* ${audioText}\n\n` +
            "Оберіть, що хочете змінити:",
            {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback("📰 Змінити частоту новин", "change_frequency")],
                    [Markup.button.callback("🎧 Увімкнути/Вимкнути подкасти", "toggle_audio")],
                    [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                ]).reply_markup
            }
        );
    }

    private registerHandlers(): void {
        this.scene.enter(async (ctx) => {
            try {
                console.log("=== SettingsScene ENTER called ===");
                await this.showMainSettings(ctx);
            } catch (error) {
                console.log("Settings scene error:", error);
                await ctx.reply(
                    "❌ Виникла помилка при завантаженні налаштувань. Спробуйте пізніше.",
                    Markup.inlineKeyboard([
                        [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                    ])
                );
            }
        });

        // Handle /start command
        this.scene.command('start', async (ctx) => {
            try {
                await ctx.reply("🔙 Повертаємося до головного меню...");
                await ctx.scene.leave();
                await ctx.scene.enter("start");
            } catch (error: any) {
                console.log("Error handling /start command:", error);
                // If user blocked the bot, just leave the scene silently
                if (error.code === 403) {
                    try {
                        await ctx.scene.leave();
                    } catch (leaveError) {
                        console.log("Error leaving scene:", leaveError);
                    }
                }
            }
        });

        // Handler for changing news frequency
        this.scene.action("change_frequency", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const userId = ctx.from!.id;
                const settings = await this.userSettingsService.getUserSettings(userId);

                await ctx.editMessageText(
                    "📰 *Оберіть частоту отримання новин:*\n\n" +
                    "Як часто ви хочете отримувати новини за вашими підписками?\n\n" +
                    `*Поточна частота:* ${this.getFrequencyText(settings!.newsFrequency)}`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("⏰ Щогодини", `freq_${NewsFrequency.HOURLY}`)],
                            [Markup.button.callback("🕒 Кожні 3 години", `freq_${NewsFrequency.EVERY_3_HOURS}`)],
                            [Markup.button.callback("🌅🌙 Двічі на день", `freq_${NewsFrequency.TWICE_DAILY}`)],
                            [Markup.button.callback("📅 Раз на день", `freq_${NewsFrequency.DAILY}`)],
                            [Markup.button.callback("⏸️ Вимкнути", `freq_${NewsFrequency.DISABLED}`)],
                            [Markup.button.callback("🔙 Назад до налаштувань", "back_to_settings")]
                        ]).reply_markup
                    }
                );
            } catch (error) {
                console.log("Change frequency error:", error);
            }
        });

        // Handler for frequency selection
        this.scene.action(/freq_(.+)/, async (ctx) => {
            try {
                await ctx.answerCbQuery("Налаштування збережено ✅");
                const frequency = ctx.match[1] as NewsFrequency;
                const userId = ctx.from!.id;

                await this.userSettingsService.updateNewsFrequency(userId, frequency);

                await ctx.editMessageText(
                    `✅ *Частоту новин оновлено!*\n\n` +
                    `Ви обрали: *${this.getFrequencyText(frequency)}*\n\n` +
                    "Новини будуть надходити згідно з новим розкладом.",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("🔙 Назад до налаштувань", "back_to_settings")],
                            [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                        ]).reply_markup
                    }
                );
            } catch (error) {
                console.log("Frequency selection error:", error);
            }
        });

        // Handler for toggling audio podcasts
        this.scene.action("toggle_audio", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const userId = ctx.from!.id;
                const settings = await this.userSettingsService.getUserSettings(userId);

                const currentStatus = settings!.enableAudioPodcasts;

                await ctx.editMessageText(
                    "🎧 *Налаштування аудіо подкастів*\n\n" +
                    "Аудіо подкасти - це озвучена версія новин, яку ви можете слухати в дорозі або під час інших справ.\n\n" +
                    `*Поточний статус:* ${currentStatus ? "Увімкнено ✅" : "Вимкнено ❌"}\n\n` +
                    "Що ви хочете зробити?",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback(
                                currentStatus ? "❌ Вимкнути подкасти" : "✅ Увімкнути подкасти",
                                `audio_${!currentStatus}`
                            )],
                            [Markup.button.callback("🔙 Назад до налаштувань", "back_to_settings")]
                        ]).reply_markup
                    }
                );
            } catch (error) {
                console.log("Toggle audio error:", error);
            }
        });

        // Handler for audio selection
        this.scene.action(/audio_(.+)/, async (ctx) => {
            try {
                const enabled = ctx.match[1] === 'true';
                await ctx.answerCbQuery(enabled ? "Подкасти увімкнено ✅" : "Подкасти вимкнено ❌");
                const userId = ctx.from!.id;

                await this.userSettingsService.updateAudioPodcasts(userId, enabled);

                await ctx.editMessageText(
                    `${enabled ? '✅' : '❌'} *Налаштування збережено!*\n\n` +
                    `Аудіо подкасти: *${enabled ? 'Увімкнено' : 'Вимкнено'}*\n\n` +
                    (enabled 
                        ? "Тепер ви будете отримувати аудіо версії новин разом з текстовими повідомленнями. 🎧"
                        : "Ви більше не будете отримувати аудіо версії новин. 📝"
                    ),
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("🔙 Назад до налаштувань", "back_to_settings")],
                            [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                        ]).reply_markup
                    }
                );
            } catch (error) {
                console.log("Audio selection error:", error);
            }
        });

        // Handler for back to settings
        this.scene.action("back_to_settings", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const userId = ctx.from!.id;
                const settings = await this.userSettingsService.getUserSettings(userId);

                if (!settings) {
                    await ctx.reply("❌ Помилка завантаження налаштувань");
                    return;
                }

                const frequencyText = this.getFrequencyText(settings.newsFrequency);
                const audioText = settings.enableAudioPodcasts ? "Увімкнено ✅" : "Вимкнено ❌";

                await ctx.editMessageText(
                    "⚙️ *Налаштування*\n\n" +
                    "*Ваші поточні налаштування:*\n\n" +
                    `📰 *Частота новин:* ${frequencyText}\n` +
                    `🎧 *Аудіо подкасти:* ${audioText}\n\n` +
                    "Оберіть, що хочете змінити:",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("📰 Змінити частоту новин", "change_frequency")],
                            [Markup.button.callback("🎧 Увімкнути/Вимкнути подкасти", "toggle_audio")],
                            [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                        ]).reply_markup
                    }
                );
            } catch (error) {
                console.log("Back to settings error:", error);
            }
        });

        // Handler for back to start
        this.scene.action("back_to_start", async (ctx) => {
            try {
                console.log("Back to start from SettingsScene");
                await ctx.answerCbQuery("Повертаємося до головного меню...");
                await ctx.scene.leave();
                await ctx.scene.enter("start");
            } catch (error) {
                console.log("Back to start error:", error);
            }
        });
    }
}

