import { IScene } from "./IScene";
import { Markup, Scenes } from "telegraf";
import { IBotContext } from "@context/IBotContext";
import { BaseScene } from "telegraf/scenes";
import { AdvertisementService, AdvertisementPreview } from "@application/services/AdvertisementService";
import { AdminMiddleware } from "@infrastructure/middleware/AdminMiddleware";
import { AdvertisementTargetType, AdvertisementStatus } from "@models/Advertisement";

interface SessionData {
    text?: string;
    images?: string[];
    buttons?: Array<{ text: string; url: string }>;
    targetType?: AdvertisementTargetType;
    targetData?: string;
    scheduledFor?: Date;
    currentStep?: 'text' | 'images' | 'preview' | 'target' | 'schedule' | 'confirm';
}

export class AdminAdvertisementScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "admin_advertisement";

    constructor(
        private readonly advertisementService: AdvertisementService,
        private readonly adminMiddleware: AdminMiddleware
    ) {
        this.scene = new BaseScene<IBotContext>(this.name);
        this.registerHandlers();
    }

    getScene(): BaseScene<IBotContext> {
        return this.scene;
    }

    private getSessionData(ctx: IBotContext): SessionData {
        return (ctx.scene as any).session || {};
    }

    private setSessionData(ctx: IBotContext, data: Partial<SessionData>): void {
        const sessionData = this.getSessionData(ctx);
        Object.assign((ctx.scene as any).session, { ...sessionData, ...data });
    }

    private registerHandlers() {
        this.scene.enter(async (ctx) => {
            // Check if user is admin
            const isAdmin = await this.adminMiddleware.isAdmin(ctx);
            if (!isAdmin) {
                await ctx.reply("❌ У вас немає доступу до адміністративної панелі.");
                return ctx.scene.enter("start");
            }

            await this.showMainMenu(ctx);
        });

        // Main menu actions
        this.scene.action("create_advertisement", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                this.setSessionData(ctx, { currentStep: 'text' });
                await this.requestText(ctx);
            } catch (error) {
                console.log("Error starting advertisement creation:", error);
            }
        });

        this.scene.action("view_scheduled", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await this.showScheduledAdvertisements(ctx);
            } catch (error) {
                console.log("Error showing scheduled advertisements:", error);
            }
        });

        this.scene.action("advertisement_stats", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await this.showAdvertisementStats(ctx);
            } catch (error) {
                console.log("Error showing advertisement stats:", error);
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

        // Handle /menu command
        this.scene.command('menu', async (ctx) => {
            try {
                await ctx.reply("🔙 Повертаємося до головного меню...");
                await ctx.scene.leave();
                await ctx.scene.enter("start");
            } catch (error) {
                console.log("Error handling /menu command:", error);
            }
        });

        // Text input handler
        this.scene.on('text', async (ctx) => {
            const sessionData = this.getSessionData(ctx);
            
            if (sessionData.currentStep === 'text') {
                const text = ctx.message.text;
                if (text.length > 4096) {
                    await ctx.reply("❌ Текст занадто довгий. Максимум 4096 символів.");
                    return;
                }
                
                this.setSessionData(ctx, { text, currentStep: 'images' });
                await this.requestImages(ctx);
            } else if (sessionData.currentStep === 'schedule') {
                // Handle date/time input
                const dateTimeString = ctx.message.text;
                const scheduledDate = this.parseDateTime(dateTimeString);
                
                if (!scheduledDate || scheduledDate <= new Date()) {
                    await ctx.reply("❌ Некоректна дата або час. Будь ласка, введіть майбутню дату та час у форматі 'ДД.ММ.РРРР ГГ:ХХ'.");
                    return;
                }
                
                this.setSessionData(ctx, { scheduledFor: scheduledDate, currentStep: 'confirm' });
                await this.showConfirmation(ctx);
            } else {
                // Handle unknown text messages
                const message = ctx.message.text;
                console.log(`Unknown text message in AdminAdvertisementScene: ${message}`);
                
                await ctx.reply(
                    "❓ *Невідоме повідомлення*\n\n" +
                    "Я не розумію це повідомлення. Використовуйте кнопки меню для навігації.\n\n" +
                    "🔙 Повертаємося до головного меню...",
                    { parse_mode: 'Markdown' }
                );
                
                await ctx.scene.leave();
                await ctx.scene.enter("start");
            }
        });

        // Image handling
        this.scene.on('photo', async (ctx) => {
            const sessionData = this.getSessionData(ctx);
            
            if (sessionData.currentStep === 'images') {
                const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Get highest quality
                const fileId = photo.file_id;
                
                const currentImages = sessionData.images || [];
                if (currentImages.length >= 10) {
                    await ctx.reply("❌ Максимум 10 зображень. Переходимо до наступного кроку.");
                    await this.showPreview(ctx);
                    return;
                }
                
                // Always add image (allow duplicates)
                currentImages.push(fileId);
                this.setSessionData(ctx, { images: currentImages });
                
                console.log(`Added image. Total images: ${currentImages.length}`);
                console.log(`Session images:`, currentImages);
                
                await ctx.reply(
                    `✅ Зображення додано (${currentImages.length}/10)\n\n` +
                    "📷 Додайте ще зображення або натисніть 'Продовжити'",
                    {
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("📷 Додати ще зображення", "add_more_images")],
                            [Markup.button.callback("➡️ Продовжити", "continue_to_preview")]
                        ]).reply_markup
                    }
                );
            }
        });

        // Continue without images
        this.scene.action("skip_images", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                this.setSessionData(ctx, { images: [], currentStep: 'preview' });
                await this.showPreview(ctx);
            } catch (error) {
                console.log("Error skipping images:", error);
            }
        });

        this.scene.action("add_more_images", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await this.requestImages(ctx);
            } catch (error) {
                console.log("Error requesting more images:", error);
            }
        });

        this.scene.action("continue_to_preview", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                this.setSessionData(ctx, { currentStep: 'preview' });
                await this.showPreview(ctx);
            } catch (error) {
                console.log("Error continuing to preview:", error);
            }
        });

        // Target selection
        this.scene.action(/^target_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const targetType = ctx.match[1] as AdvertisementTargetType;
                console.log(`Selected target type: ${targetType}`);
                
                if (targetType === AdvertisementTargetType.TOPIC) {
                    // Show topic selection
                    await this.showTopicSelection(ctx);
                    return;
                }
                
                this.setSessionData(ctx, { targetType, currentStep: 'schedule' });
                
                // Show target info
                const preview = await this.advertisementService.createPreview({
                    text: this.getSessionData(ctx).text || '',
                    images: this.getSessionData(ctx).images,
                    buttons: this.getSessionData(ctx).buttons,
                    targetType: targetType
                });
                
                console.log(`Preview targetInfo: ${preview.targetInfo}`);
                console.log(`Preview recipientCount: ${preview.recipientCount}`);
                
                await ctx.reply(
                    `✅ *Цільова аудиторія обрана:*\n\n` +
                    `📊 *Аудиторія:* ${preview.targetInfo}\n` +
                    `👥 *Отримувачів:* ${preview.recipientCount}`,
                    { parse_mode: 'Markdown' }
                );
                
                await this.requestSchedule(ctx);
            } catch (error) {
                console.log("Error selecting target:", error);
            }
        });

        // Topic selection
        this.scene.action(/^select_topic_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const topicId = ctx.match[1];
                console.log(`Selected topic ID: ${topicId}`);
                this.setSessionData(ctx, { targetType: AdvertisementTargetType.TOPIC, targetData: topicId, currentStep: 'schedule' });
                
                // Show target info
                const preview = await this.advertisementService.createPreview({
                    text: this.getSessionData(ctx).text || '',
                    images: this.getSessionData(ctx).images,
                    buttons: this.getSessionData(ctx).buttons,
                    targetType: AdvertisementTargetType.TOPIC,
                    targetData: topicId
                });
                
                console.log(`Preview targetInfo: ${preview.targetInfo}`);
                console.log(`Preview recipientCount: ${preview.recipientCount}`);
                
                await ctx.reply(
                    `✅ *Цільова аудиторія обрана:*\n\n` +
                    `📊 *Аудиторія:* ${preview.targetInfo}\n` +
                    `👥 *Отримувачів:* ${preview.recipientCount}`,
                    { parse_mode: 'Markdown' }
                );
                
                await this.requestSchedule(ctx);
            } catch (error) {
                console.log("Error selecting topic:", error);
            }
        });

        // Schedule selection
        this.scene.action("send_now", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                this.setSessionData(ctx, { scheduledFor: undefined, currentStep: 'confirm' });
                await this.showConfirmation(ctx);
            } catch (error) {
                console.log("Error selecting send now:", error);
            }
        });

        this.scene.action("schedule_later", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                this.setSessionData(ctx, { currentStep: 'schedule' });
                await this.requestScheduleTime(ctx);
            } catch (error) {
                console.log("Error selecting schedule later:", error);
            }
        });

        // Quick schedule options
        this.scene.action(/^schedule_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const option = ctx.match[1];
                const scheduledFor = this.parseScheduleOption(option);
                
                if (scheduledFor) {
                    this.setSessionData(ctx, { scheduledFor, currentStep: 'confirm' });
                    await this.showConfirmation(ctx);
                } else {
                    await ctx.reply("❌ Невірний час. Спробуйте ще раз.");
                }
            } catch (error) {
                console.log("Error scheduling:", error);
            }
        });

        // Confirmation
        this.scene.action("confirm_advertisement", async (ctx) => {
            try {
                await ctx.answerCbQuery("⏳ Створюємо рекламний пост...");
                await this.createAdvertisement(ctx);
            } catch (error) {
                console.log("Error confirming advertisement:", error);
            }
        });

        this.scene.action("cancel_advertisement", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                // Clear session
                this.setSessionData(ctx, {
                    text: undefined,
                    images: undefined,
                    buttons: undefined,
                    targetType: undefined,
                    targetData: undefined,
                    scheduledFor: undefined,
                    currentStep: undefined
                });
                await this.showMainMenu(ctx);
            } catch (error) {
                console.log("Error cancelling advertisement:", error);
            }
        });

        // Back to admin menu
        this.scene.action("back_to_admin", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                // Clear session
                this.setSessionData(ctx, {
                    text: undefined,
                    images: undefined,
                    buttons: undefined,
                    targetType: undefined,
                    targetData: undefined,
                    scheduledFor: undefined,
                    currentStep: undefined
                });
                await ctx.scene.enter("admin_menu");
            } catch (error) {
                console.log("Error going back to admin menu:", error);
            }
        });
    }

    private async showTopicSelection(ctx: IBotContext) {
        try {
            const topics = await this.advertisementService.adminService.getAllTopics();
            
            if (topics.length === 0) {
                await ctx.reply(
                    "❌ *Немає доступних топіків*\n\n" +
                    "Спочатку створіть топіки в адміністративній панелі.",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("🔙 Назад", "back_to_admin")]
                        ]).reply_markup
                    }
                );
                return;
            }
            
            const topicButtons = topics.map(topic => 
                [Markup.button.callback(`📰 ${topic.name}`, `select_topic_${topic._id}`)]
            );
            
            topicButtons.push([Markup.button.callback("🔙 Назад", "back_to_admin")]);
            
            await ctx.reply(
                "📰 *Оберіть топік для реклами:*\n\n" +
                "Виберіть топік, підписникам якого буде відправлена реклама:",
                {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard(topicButtons).reply_markup
                }
            );
        } catch (error) {
            console.log("Error showing topic selection:", error);
            await ctx.reply("❌ Виникла помилка при завантаженні топіків.");
        }
    }

    private async showMainMenu(ctx: IBotContext) {
        const stats = await this.advertisementService.getAdvertisementStats();
        
        await ctx.reply(
            "📢 *Рекламні пости*\n\n" +
            `📊 *Статистика:*\n` +
            `• Всього: ${stats.total}\n` +
            `• Заплановані: ${stats.scheduled}\n` +
            `• Відправлені: ${stats.sent}\n` +
            `• Помилки: ${stats.failed}\n\n` +
            "Оберіть дію:",
            {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback("✍️ Створити новий пост", "create_advertisement")],
                    [Markup.button.callback("📅 Заплановані пости", "view_scheduled")],
                    [Markup.button.callback("📊 Статистика", "advertisement_stats")],
                    [Markup.button.callback("🔙 Назад до адмін панелі", "back_to_admin")]
                ]).reply_markup
            }
        );
    }

    private async requestText(ctx: IBotContext) {
        await ctx.reply(
            "✍️ *Введіть текст рекламного посту*\n\n" +
            "Ви можете використовувати Markdown для форматування:\n" +
            "• *жирний текст*\n" +
            "• _курсив_\n" +
            "• `код`\n" +
            "• [посилання](https://example.com)\n\n" +
            "Максимум 4096 символів.",
            { 
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback("❌ Скасувати", "cancel_advertisement")]
                ]).reply_markup
            }
        );
    }

    private async requestImages(ctx: IBotContext) {
        await ctx.reply(
            "📷 *Додайте зображення*\n\n" +
            "Надішліть фото або натисніть 'Пропустити':\n" +
            "• Максимум 10 зображень\n" +
            "• Підтримуються JPG, PNG, GIF",
            {
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback("⏭️ Пропустити", "skip_images")]
                ]).reply_markup
            }
        );
    }

    private async showPreview(ctx: IBotContext) {
        const sessionData = this.getSessionData(ctx);
        
        if (!sessionData.text) {
            await ctx.reply("❌ Помилка: текст не знайдено.");
            return;
        }

        const preview = await this.advertisementService.createPreview({
            text: sessionData.text,
            images: sessionData.images,
            buttons: sessionData.buttons,
            targetType: AdvertisementTargetType.ALL // Default for preview
        });

        // Send preview header as separate message
        await ctx.reply("📋 *Попередній перегляд рекламного посту:*", { parse_mode: 'Markdown' });

        // Send preview with images if available
        if (sessionData.images && sessionData.images.length > 0) {
            console.log(`Preview: Found ${sessionData.images.length} images:`, sessionData.images);
            try {
                if (sessionData.images.length === 1) {
                    // Send single image with text
                    await ctx.replyWithPhoto(sessionData.images[0], {
                        caption: sessionData.text,
                        parse_mode: 'Markdown'
                    });
                } else {
                    // Send multiple images as media group
                    const media = sessionData.images.map((fileId, index) => ({
                        type: 'photo' as const,
                        media: fileId,
                        caption: index === 0 ? sessionData.text : undefined
                    }));
                    await ctx.replyWithMediaGroup(media);
                }
            } catch (error) {
                console.log("Error sending preview with images:", error);
                // Fallback to text only
                await ctx.reply(sessionData.text);
            }
        } else {
            await ctx.reply(sessionData.text);
        }

        // Show preview info without target audience
        let infoMessage = "━━━━━━━━━━━━━━━━━━━━\n\n";
        infoMessage += `📷 *Зображень:* ${sessionData.images ? sessionData.images.length : 0}\n`;
        infoMessage += `📝 *Текст:* ${sessionData.text.length} символів\n`;

        await ctx.reply(infoMessage, { parse_mode: 'Markdown' });

        // Show target selection
        await ctx.reply(
            "🎯 *Оберіть цільову аудиторію:*",
            {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback("👥 Всім користувачам", "target_ALL")],
                    [Markup.button.callback("✅ Активним користувачам", "target_ACTIVE")],
                    [Markup.button.callback("📰 За топіками", "target_TOPIC")],
                    [Markup.button.callback("🔙 Назад", "back_to_admin")]
                ]).reply_markup
            }
        );
    }

    private async sendTextPreview(ctx: IBotContext, text: string, preview: AdvertisementPreview) {
        let message = "📋 <b>Попередній перегляд рекламного посту:</b>\n\n";
        message += "━━━━━━━━━━━━━━━━━━━━\n";
        message += `<b>${text}</b>\n`;
        message += "━━━━━━━━━━━━━━━━━━━━\n\n";
        message += `📊 <b>Цільова аудиторія:</b> ${preview.targetInfo}\n`;
        message += `👥 <b>Отримувачів:</b> ${preview.recipientCount}\n`;
        
        if (preview.images && preview.images.length > 0) {
            message += `📷 <b>Зображень:</b> ${preview.images.length}\n`;
        }

        await ctx.reply(message, { parse_mode: 'HTML' });
    }

    private async requestSchedule(ctx: IBotContext) {
        await ctx.reply(
            "⏰ *Коли відправити пост?*",
            {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback("🟢 Зараз", "send_now")],
                    [Markup.button.callback("🕐 Через 1 годину", "schedule_1h")],
                    [Markup.button.callback("🕐 Через 3 години", "schedule_3h")],
                    [Markup.button.callback("🕐 Через 6 годин", "schedule_6h")],
                    [Markup.button.callback("🕐 Завтра о 9:00", "schedule_tomorrow_9")],
                    [Markup.button.callback("🕐 Завтра о 18:00", "schedule_tomorrow_18")],
                    [Markup.button.callback("📅 Обрати дату і час", "schedule_later")],
                    [Markup.button.callback("🔙 Назад", "back_to_admin")]
                ]).reply_markup
            }
        );
    }

    private async requestScheduleTime(ctx: IBotContext) {
        await ctx.reply(
            "📅 *Оберіть дату та час*\n\n" +
            "Введіть час у форматі:\n" +
            "• `25.01.2024 18:00`\n" +
            "• `завтра 15:30`\n" +
            "• `через 2 години`",
            { parse_mode: 'Markdown' }
        );
    }

    private parseScheduleOption(option: string): Date | null {
        const now = new Date();
        
        switch (option) {
            case '1h':
                return new Date(now.getTime() + 60 * 60 * 1000);
            case '3h':
                return new Date(now.getTime() + 3 * 60 * 60 * 1000);
            case '6h':
                return new Date(now.getTime() + 6 * 60 * 60 * 1000);
            case 'tomorrow_9':
                const tomorrow9 = new Date(now);
                tomorrow9.setDate(tomorrow9.getDate() + 1);
                tomorrow9.setHours(9, 0, 0, 0);
                return tomorrow9;
            case 'tomorrow_18':
                const tomorrow18 = new Date(now);
                tomorrow18.setDate(tomorrow18.getDate() + 1);
                tomorrow18.setHours(18, 0, 0, 0);
                return tomorrow18;
            default:
                return null;
        }
    }

    private parseDateTime(dateTimeString: string): Date | null {
        const now = new Date();
        
        // Handle different formats
        if (dateTimeString.includes('.')) {
            // Format: DD.MM.YYYY HH:MM
            const parts = dateTimeString.split(' ');
            if (parts.length !== 2) return null;
            
            const datePart = parts[0];
            const timePart = parts[1];
            
            const dateParts = datePart.split('.');
            if (dateParts.length !== 3) return null;
            
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
            const year = parseInt(dateParts[2]);
            
            const timeParts = timePart.split(':');
            if (timeParts.length !== 2) return null;
            
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            
            return new Date(year, month, day, hours, minutes);
        } else if (dateTimeString.includes('завтра')) {
            // Format: завтра HH:MM
            const timeMatch = dateTimeString.match(/(\d{1,2}):(\d{2})/);
            if (!timeMatch) return null;
            
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(hours, minutes, 0, 0);
            
            return tomorrow;
        } else if (dateTimeString.includes('через')) {
            // Format: через X годин або через X хвилин
            const hoursMatch = dateTimeString.match(/через (\d+) годин/);
            const minutesMatch = dateTimeString.match(/через (\d+) хвилин/);
            
            if (hoursMatch) {
                const hours = parseInt(hoursMatch[1]);
                const future = new Date(now);
                future.setHours(future.getHours() + hours);
                return future;
            } else if (minutesMatch) {
                const minutes = parseInt(minutesMatch[1]);
                const future = new Date(now);
                future.setMinutes(future.getMinutes() + minutes);
                return future;
            }
            
            return null;
        }
        
        return null;
    }

    private async showConfirmation(ctx: IBotContext) {
        const sessionData = this.getSessionData(ctx);
        
        if (!sessionData.text || !sessionData.targetType) {
            await ctx.reply("❌ Помилка: не вистачає даних для підтвердження.");
            return;
        }

        const preview = await this.advertisementService.createPreview({
            text: sessionData.text,
            images: sessionData.images,
            buttons: sessionData.buttons,
            targetType: sessionData.targetType,
            targetData: sessionData.targetData
        });

        // Send confirmation with images if available
        if (sessionData.images && sessionData.images.length > 0) {
            try {
                // Send first image with confirmation text
                let caption = "✅ *Підтвердження рекламного посту*\n\n";
                caption += sessionData.text + "\n\n";
                caption += `🎯 *Аудиторія:* ${preview.targetInfo}\n`;
                caption += `👥 *Отримувачів:* ${preview.recipientCount}\n`;
                
                if (sessionData.scheduledFor) {
                    caption += `⏰ *Час відправки:* ${sessionData.scheduledFor.toLocaleString('uk-UA')}\n`;
                } else {
                    caption += `⏰ *Час відправки:* Зараз\n`;
                }

                if (sessionData.images.length === 1) {
                    // Send single image with confirmation text
                    await ctx.replyWithPhoto(sessionData.images[0], {
                        caption: caption,
                        parse_mode: 'Markdown'
                    });
                } else {
                    // Send multiple images as media group
                    const media = sessionData.images.map((fileId, index) => ({
                        type: 'photo' as const,
                        media: fileId,
                        caption: index === 0 ? caption : undefined
                    }));
                    await ctx.replyWithMediaGroup(media);
                }
            } catch (error) {
                console.log("Error sending confirmation with images:", error);
                // Fallback to text only
                await this.sendTextConfirmation(ctx, sessionData.text, preview, sessionData.scheduledFor);
            }
        } else {
            await this.sendTextConfirmation(ctx, sessionData.text, preview, sessionData.scheduledFor);
        }

        await ctx.reply(
            "Підтвердити створення рекламного посту?",
            {
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback("✅ Підтвердити", "confirm_advertisement")],
                    [Markup.button.callback("❌ Скасувати", "cancel_advertisement")]
                ]).reply_markup
            }
        );
    }

    private async sendTextConfirmation(ctx: IBotContext, text: string, preview: AdvertisementPreview, scheduledFor?: Date) {
        let message = "✅ <b>Підтвердження рекламного посту</b>\n\n";
        message += "━━━━━━━━━━━━━━━━━━━━\n";
        message += `<b>${text}</b>\n`;
        message += "━━━━━━━━━━━━━━━━━━━━\n\n";
        message += `🎯 <b>Аудиторія:</b> ${preview.targetInfo}\n`;
        message += `👥 <b>Отримувачів:</b> ${preview.recipientCount}\n`;
        
        if (scheduledFor) {
            message += `⏰ <b>Час відправки:</b> ${scheduledFor.toLocaleString('uk-UA')}\n`;
        } else {
            message += `⏰ <b>Час відправки:</b> Зараз\n`;
        }

        await ctx.reply(message, { parse_mode: 'HTML' });
    }

    private async createAdvertisement(ctx: IBotContext) {
        const sessionData = this.getSessionData(ctx);
        
        try {
            const advertisement = await this.advertisementService.createAdvertisement({
                text: sessionData.text!,
                images: sessionData.images,
                buttons: sessionData.buttons,
                targetType: sessionData.targetType!,
                targetData: sessionData.targetData,
                scheduledFor: sessionData.scheduledFor,
                createdBy: String(ctx.from?.id)
            });

            let message = "✅ *Рекламний пост створено!*\n\n";
            
            if (sessionData.scheduledFor) {
                message += `📅 Заплановано на: ${sessionData.scheduledFor.toLocaleString('uk-UA')}\n`;
                message += "Пост буде відправлено автоматично в зазначений час.";
            } else {
                message += "🚀 Пост відправляється зараз...";
                
                // Send immediately
                const result = await this.advertisementService.sendAdvertisement(String(advertisement._id));
                message += `\n\n${result.message}`;
            }

            await ctx.reply(message, { parse_mode: 'Markdown' });
            
            // Clear session and return to main menu
            this.setSessionData(ctx, {
                text: undefined,
                images: undefined,
                buttons: undefined,
                targetType: undefined,
                targetData: undefined,
                scheduledFor: undefined,
                currentStep: undefined
            });
            await this.showMainMenu(ctx);

        } catch (error) {
            console.log("Error creating advertisement:", error);
            await ctx.reply("❌ Помилка при створенні рекламного посту.");
        }
    }

    private async showScheduledAdvertisements(ctx: IBotContext) {
        try {
            const scheduled = await this.advertisementService.getScheduledAdvertisements();
            console.log(`Found ${scheduled.length} scheduled advertisements:`, scheduled.map(s => ({ id: s._id, scheduledFor: s.scheduledFor, status: s.status })));
            
            if (scheduled.length === 0) {
            await ctx.reply(
                "📅 *Заплановані пости*\n\n" +
                "Немає запланованих постів.",
                {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback("🔙 Назад", "back_to_admin")]
                    ]).reply_markup
                }
            );
            return;
        }

        let message = "📅 *Заплановані пости*\n\n";
        
        for (let i = 0; i < Math.min(scheduled.length, 5); i++) {
            const ad = scheduled[i];
            message += `${i + 1}. ${ad.text.substring(0, 50)}...\n`;
            message += `   📅 ${ad.scheduledFor?.toLocaleString('uk-UA')}\n\n`;
        }

        if (scheduled.length > 5) {
            message += `... та ще ${scheduled.length - 5} постів`;
        }

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback("🔙 Назад", "back_to_admin")]
            ]).reply_markup
        });
        } catch (error) {
            console.log("Error showing scheduled advertisements:", error);
            await ctx.reply("❌ Виникла помилка при завантаженні запланованих постів.");
        }
    }

    private async showAdvertisementStats(ctx: IBotContext) {
        const stats = await this.advertisementService.getAdvertisementStats();
        
        await ctx.reply(
            "📊 *Статистика рекламних постів*\n\n" +
            `📈 *Загальна статистика:*\n` +
            `• Всього постів: ${stats.total}\n` +
            `• Заплановані: ${stats.scheduled}\n` +
            `• Відправлені: ${stats.sent}\n` +
            `• Помилки: ${stats.failed}\n\n` +
            `📊 *Успішність:* ${stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%`,
            {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback("🔙 Назад", "back_to_admin")]
                ]).reply_markup
            }
        );
    }
}
