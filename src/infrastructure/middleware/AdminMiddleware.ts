import { IBotContext } from '@context/IBotContext';
import { IUserRepository } from '@infrastructure/repositories/IUserRepository';
import { UserRole } from '@models/User';

export class AdminMiddleware {
    constructor(private readonly userRepository: IUserRepository) {}

    // Check if user is admin (ADMIN or OWNER)
    async isAdmin(ctx: IBotContext): Promise<boolean> {
        const userId = String(ctx.from?.id);
        if (!userId) return false;

        const user = await this.userRepository.findById(userId);
        return (user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER) && !user?.isBlocked;
    }

    // Check if user is owner (super admin)
    async isOwner(ctx: IBotContext): Promise<boolean> {
        const userId = String(ctx.from?.id);
        if (!userId) return false;

        const user = await this.userRepository.findById(userId);
        return user?.role === UserRole.OWNER && !user?.isBlocked;
    }

    // Middleware function for admin routes
    async checkAdmin(ctx: IBotContext, next: () => Promise<void>): Promise<void> {
        const isAdmin = await this.isAdmin(ctx);
        
        if (!isAdmin) {
            await ctx.reply('❌ У вас немає доступу до адміністративної панелі.');
            return;
        }

        return next();
    }

    // Check if user is blocked
    async isBlocked(ctx: IBotContext): Promise<boolean> {
        const userId = String(ctx.from?.id);
        if (!userId) return false;

        const user = await this.userRepository.findById(userId);
        return user?.isBlocked || false;
    }

    // Middleware to block access for blocked users
    async checkNotBlocked(ctx: IBotContext, next: () => Promise<void>): Promise<void> {
        const blocked = await this.isBlocked(ctx);
        
        if (blocked) {
            await ctx.reply('🚫 Ваш акаунт заблоковано. Зверніться до адміністратора.');
            return;
        }

        return next();
    }
}

