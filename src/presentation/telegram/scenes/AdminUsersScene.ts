import { IScene } from "./IScene";
import { Markup, Scenes } from "telegraf";
import { IBotContext } from "@context/IBotContext";
import { BaseScene } from "telegraf/scenes";
import { IAdminService } from "@application/interfaces/IAdminService";
import { AdminMiddleware } from "@infrastructure/middleware/AdminMiddleware";
import { UserRole } from "@models/User";

interface SessionData {
    action?: 'view' | 'block' | 'unblock' | 'set_admin' | 'remove_admin';
    userId?: string;
    page?: number;
}

export class AdminUsersScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "admin_users";
    private readonly USERS_PER_PAGE = 10;

    constructor(
        private readonly adminService: IAdminService,
        private readonly adminMiddleware: AdminMiddleware
    ) {
        this.scene = new BaseScene<IBotContext>(this.name);
        this.registerHandlers();
    }

    getScene(): BaseScene<IBotContext> {
        return this.scene;
    }

    private getSessionData(ctx: IBotContext): SessionData {
        if (!ctx.scene.session) {
            (ctx.scene as any).session = {};
        }
        if (!(ctx.scene.session as any).adminUsers) {
            (ctx.scene.session as any).adminUsers = { page: 0 };
        }
        return (ctx.scene.session as any).adminUsers;
    }

    private registerHandlers() {
        this.scene.enter(async (ctx) => {
            const isAdmin = await this.adminMiddleware.isAdmin(ctx);
            if (!isAdmin) {
                await ctx.reply("❌ У вас немає доступу до цієї функції.");
                return ctx.scene.enter("start");
            }

            const sessionData = this.getSessionData(ctx);
            sessionData.page = 0;

            await this.showUsersList(ctx);
        });

        this.scene.action(/^user_details_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const userId = ctx.match[1];
                await this.showUserDetails(ctx, userId);
            } catch (error) {
                console.log("Error showing user details:", error);
            }
        });

        this.scene.action(/^block_user_(.+)$/, async (ctx) => {
            try {
                const userId = ctx.match[1];
                const currentAdminId = String(ctx.from?.id);
                const currentAdmin = await this.adminService.getUserById(currentAdminId);
                const targetUser = await this.adminService.getUserById(userId);

                // Prevent self-blocking
                if (userId === currentAdminId) {
                    await ctx.answerCbQuery("⚠️ Ви не можете заблокувати себе!");
                    return;
                }

                // Only OWNER can block admins
                if ((targetUser?.role === UserRole.ADMIN || targetUser?.role === UserRole.OWNER) && currentAdmin?.role !== UserRole.OWNER) {
                    await ctx.answerCbQuery("🔒 Тільки Власник може блокувати адміністраторів!");
                    return;
                }

                await ctx.answerCbQuery();
                const result = await this.adminService.blockUser(userId);
                
                if (result) {
                    await ctx.reply("✅ Користувача успішно заблоковано!");
                } else {
                    await ctx.reply("❌ Помилка при блокуванні користувача.");
                }

                await this.showUserDetails(ctx, userId);
            } catch (error) {
                console.log("Error blocking user:", error);
                await ctx.reply("❌ Помилка при блокуванні користувача.");
            }
        });

        this.scene.action(/^unblock_user_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const userId = ctx.match[1];

                const result = await this.adminService.unblockUser(userId);
                
                if (result) {
                    await ctx.reply("✅ Користувача успішно розблоковано!");
                } else {
                    await ctx.reply("❌ Помилка при розблокуванні користувача.");
                }

                await this.showUserDetails(ctx, userId);
            } catch (error) {
                console.log("Error unblocking user:", error);
                await ctx.reply("❌ Помилка при розблокуванні користувача.");
            }
        });

        this.scene.action(/^set_admin_(.+)$/, async (ctx) => {
            try {
                const userId = ctx.match[1];
                const currentAdminId = String(ctx.from?.id);
                const currentAdmin = await this.adminService.getUserById(currentAdminId);

                // Only OWNER can set admin role
                if (currentAdmin?.role !== UserRole.OWNER) {
                    await ctx.answerCbQuery("🔒 Тільки Власник може призначати адміністраторів!");
                    return;
                }

                await ctx.answerCbQuery();
                const result = await this.adminService.setUserRole(userId, UserRole.ADMIN);
                
                if (result) {
                    await ctx.reply("✅ Користувачу надано права адміністратора!");
                } else {
                    await ctx.reply("❌ Помилка при наданні прав адміністратора.");
                }

                await this.showUserDetails(ctx, userId);
            } catch (error) {
                console.log("Error setting admin role:", error);
                await ctx.reply("❌ Помилка при наданні прав адміністратора.");
            }
        });

        this.scene.action(/^remove_admin_(.+)$/, async (ctx) => {
            try {
                const userId = ctx.match[1];
                const currentAdminId = String(ctx.from?.id);
                const currentAdmin = await this.adminService.getUserById(currentAdminId);

                // Prevent removing own admin rights
                if (userId === currentAdminId) {
                    await ctx.answerCbQuery("⚠️ Ви не можете зняти права адміна з себе!");
                    return;
                }

                // Only OWNER can remove admin role
                if (currentAdmin?.role !== UserRole.OWNER) {
                    await ctx.answerCbQuery("🔒 Тільки Власник може знімати права адміністратора!");
                    return;
                }

                await ctx.answerCbQuery();
                const result = await this.adminService.setUserRole(userId, UserRole.USER);
                
                if (result) {
                    await ctx.reply("✅ Права адміністратора видалено!");
                } else {
                    await ctx.reply("❌ Помилка при видаленні прав адміністратора.");
                }

                await this.showUserDetails(ctx, userId);
            } catch (error) {
                console.log("Error removing admin role:", error);
                await ctx.reply("❌ Помилка при видаленні прав адміністратора.");
            }
        });

        this.scene.action(/^set_owner_(.+)$/, async (ctx) => {
            try {
                const userId = ctx.match[1];
                const currentAdminId = String(ctx.from?.id);
                const currentAdmin = await this.adminService.getUserById(currentAdminId);

                // Only OWNER can set owner role
                if (currentAdmin?.role !== UserRole.OWNER) {
                    await ctx.answerCbQuery("🔒 Тільки Власник може призначати інших власників!");
                    return;
                }

                await ctx.answerCbQuery();
                const result = await this.adminService.setUserRole(userId, UserRole.OWNER);
                
                if (result) {
                    await ctx.reply("🔱 Користувачу надано права власника!");
                } else {
                    await ctx.reply("❌ Помилка при наданні прав власника.");
                }

                await this.showUserDetails(ctx, userId);
            } catch (error) {
                console.log("Error setting owner role:", error);
                await ctx.reply("❌ Помилка при наданні прав власника.");
            }
        });

        this.scene.action(/^demote_to_admin_(.+)$/, async (ctx) => {
            try {
                const userId = ctx.match[1];
                const currentAdminId = String(ctx.from?.id);
                const currentAdmin = await this.adminService.getUserById(currentAdminId);

                // Prevent demoting yourself
                if (userId === currentAdminId) {
                    await ctx.answerCbQuery("⚠️ Ви не можете понизити власну роль!");
                    return;
                }

                // Only OWNER can demote other owners
                if (currentAdmin?.role !== UserRole.OWNER) {
                    await ctx.answerCbQuery("🔒 Недостатньо прав!");
                    return;
                }

                await ctx.answerCbQuery();
                const result = await this.adminService.setUserRole(userId, UserRole.ADMIN);
                
                if (result) {
                    await ctx.reply("✅ Користувача понижено до адміністратора!");
                } else {
                    await ctx.reply("❌ Помилка при зміні ролі.");
                }

                await this.showUserDetails(ctx, userId);
            } catch (error) {
                console.log("Error demoting owner:", error);
                await ctx.reply("❌ Помилка при зміні ролі.");
            }
        });

        this.scene.action("next_page", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const sessionData = this.getSessionData(ctx);
                sessionData.page = (sessionData.page || 0) + 1;
                await this.showUsersList(ctx);
            } catch (error) {
                console.log("Error navigating to next page:", error);
            }
        });

        this.scene.action("prev_page", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const sessionData = this.getSessionData(ctx);
                sessionData.page = Math.max((sessionData.page || 0) - 1, 0);
                await this.showUsersList(ctx);
            } catch (error) {
                console.log("Error navigating to previous page:", error);
            }
        });

        this.scene.action("back_to_users", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await this.showUsersList(ctx);
            } catch (error) {
                console.log("Error returning to users list:", error);
            }
        });

        this.scene.action("back_to_admin", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.enter("admin_menu");
            } catch (error) {
                console.log("Error returning to admin menu:", error);
            }
        });
    }

    private async showUsersList(ctx: IBotContext) {
        try {
            const sessionData = this.getSessionData(ctx);
            const page = sessionData.page || 0;

            const allUsers = await this.adminService.getAllUsers();
            const totalPages = Math.ceil(allUsers.length / this.USERS_PER_PAGE);
            const start = page * this.USERS_PER_PAGE;
            const end = start + this.USERS_PER_PAGE;
            const users = allUsers.slice(start, end);

            if (allUsers.length === 0) {
                await ctx.reply(
                    "👥 *Керування користувачами*\n\n" +
                    "Користувачів ще немає.",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("🔙 Назад", "back_to_admin")]
                        ]).reply_markup
                    }
                );
                return;
            }

            let message = `👥 *Керування користувачами*\n\n`;
            message += `📋 Всього користувачів: *${allUsers.length}*\n`;
            message += `📄 Сторінка ${page + 1} з ${totalPages}\n\n`;
            message += `💡 *Оберіть користувача*, щоб переглянути деталі та керувати доступом.\n\n`;
            message += `*Позначення:*\n`;
            message += `🔱 - Власник (Super Admin)\n`;
            message += `👑 - Адміністратор\n`;
            message += `👤 - Звичайний користувач\n`;
            message += `✅ - Активний\n`;
            message += `🚫 - Заблокований\n\n`;
            message += `─────────────────────\n\n`;
            
            users.forEach((user, index) => {
                const userNum = start + index + 1;
                let roleIcon = '👤';
                if (user.role === UserRole.OWNER) roleIcon = '🔱';
                else if (user.role === UserRole.ADMIN) roleIcon = '👑';
                
                const statusIcon = user.isBlocked ? '🚫' : '✅';
                message += `${userNum}. ${roleIcon} *${user.username || 'Без імені'}* ${statusIcon}\n`;
                message += `   ID: \`${user._id}\`\n\n`;
            });

            const buttons = users.map(user => {
                let roleIcon = '👤';
                if (user.role === UserRole.OWNER) roleIcon = '🔱';
                else if (user.role === UserRole.ADMIN) roleIcon = '👑';
                
                const statusIcon = user.isBlocked ? '🚫' : '✅';
                return [
                    Markup.button.callback(
                        `${roleIcon} ${user.username || 'Без імені'} ${statusIcon}`, 
                        `user_details_${user._id}`
                    )
                ];
            });

            // Pagination buttons
            const navButtons = [];
            if (page > 0) {
                navButtons.push(Markup.button.callback("◀️ Попередня", "prev_page"));
            }
            if (page < totalPages - 1) {
                navButtons.push(Markup.button.callback("Наступна ▶️", "next_page"));
            }
            if (navButtons.length > 0) {
                buttons.push(navButtons);
            }

            buttons.push([Markup.button.callback("🔙 Назад", "back_to_admin")]);

            await ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard(buttons).reply_markup
            });
        } catch (error) {
            console.log("Error showing users list:", error);
            await ctx.reply("❌ Помилка при завантаженні списку користувачів.");
        }
    }

    private async showUserDetails(ctx: IBotContext, userId: string) {
        try {
            const user = await this.adminService.getUserById(userId);
            
            if (!user) {
                await ctx.reply("❌ Користувача не знайдено.");
                return;
            }

            const currentAdminId = String(ctx.from?.id);
            const currentAdmin = await this.adminService.getUserById(currentAdminId);
            const isOwner = currentAdmin?.role === UserRole.OWNER;
            const isSelf = userId === currentAdminId;
            const targetIsAdminOrOwner = user.role === UserRole.ADMIN || user.role === UserRole.OWNER;

            let roleIcon = '👤';
            let roleText = 'Користувач 👤';
            if (user.role === UserRole.OWNER) {
                roleIcon = '🔱';
                roleText = 'Власник 🔱';
            } else if (user.role === UserRole.ADMIN) {
                roleIcon = '👑';
                roleText = 'Адміністратор 👑';
            }
            
            const statusIcon = user.isBlocked ? '🚫' : '✅';
            
            let message = 
                `${roleIcon} *Інформація про користувача*\n\n` +
                `*ID:* \`${user._id}\`\n` +
                `*Ім'я:* ${user.username || 'Без імені'}\n` +
                `*Роль:* ${roleText}\n` +
                `*Статус:* ${user.isBlocked ? 'Заблокований 🚫' : 'Активний ✅'}\n` +
                `*Дата реєстрації:* ${new Date(user.createdAt).toLocaleDateString('uk-UA')}`;

            if (isSelf) {
                message += `\n\n⚠️ *Це ваш власний акаунт*`;
            }

            const buttons = [];

            // Only OWNER can manage admins and other owners
            const canManage = isSelf ? false : (isOwner || !targetIsAdminOrOwner);

            if (!canManage && !isSelf) {
                message += `\n\n🔒 *Ви не можете керувати адміністраторами.*\n`;
                message += `Тільки Власник (🔱) може змінювати права адміністраторів.`;
            }

            // Block/Unblock button
            if (canManage) {
                if (user.isBlocked) {
                    buttons.push([Markup.button.callback("✅ Розблокувати", `unblock_user_${userId}`)]);
                } else {
                    buttons.push([Markup.button.callback("🚫 Заблокувати", `block_user_${userId}`)]);
                }
            }

            // Admin role toggle - only for OWNER
            if (canManage && isOwner) {
                if (user.role === UserRole.OWNER) {
                    buttons.push([Markup.button.callback("👑 Зробити адміном", `demote_to_admin_${userId}`)]);
                } else if (user.role === UserRole.ADMIN) {
                    buttons.push([Markup.button.callback("👤 Зняти права адміна", `remove_admin_${userId}`)]);
                    buttons.push([Markup.button.callback("🔱 Зробити власником", `set_owner_${userId}`)]);
                } else {
                    buttons.push([Markup.button.callback("👑 Зробити адміном", `set_admin_${userId}`)]);
                }
            }

            if (isSelf) {
                message += `\n\n💡 Ви не можете змінити роль або статус власного акаунта.`;
            }

            buttons.push([Markup.button.callback("🔙 Назад до списку", "back_to_users")]);

            await ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard(buttons).reply_markup
            });
        } catch (error) {
            console.log("Error showing user details:", error);
            await ctx.reply("❌ Помилка при завантаженні інформації про користувача.");
        }
    }
}

