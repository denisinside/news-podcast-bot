import { IMessageTemplateService } from "../interfaces/IMessageTemplateService";
import { IArticle } from "@/models";

export class MessageTemplateService implements IMessageTemplateService {
    
    formatNewsNotification(article: IArticle, topicName: string): string {
        const truncatedContent = this.truncateText(article.content, 1000);
        
        const message = `📰 *Новина з теми "${topicName}"*

🔹 *${this.escapeMarkdown(article.title)}*

📝 ${this.escapeMarkdown(truncatedContent)}

🔗 [Читати повністю](${article.url})

📅 Опубліковано: ${this.formatDate(article.publicationDate)}
📡 Джерело: ${this.escapeMarkdown(article.source)}`;

        return this.truncateText(message, 4000);
    }

    formatPodcastNotification(podcastUrl: string, topics: string[], duration?: string): string {
        const topicsList = topics.map(topic => `• ${this.escapeMarkdown(topic)}`).join('\n');
        const durationText = duration ? `\n⏱️ Тривалість: ${duration}` : '';
        
        const message = `🎙️ *Ваш персональний подкаст готовий!*

📋 *Теми в подкасті:*
${topicsList}${durationText}

🎧 [Слухати подкаст](${podcastUrl})

💡 Подкаст згенеровано на основі ваших підписок`;

        return this.truncateText(message, 4000);
    }

    formatErrorNotification(error: string): string {
        return `❌ *Помилка*

${this.escapeMarkdown(error)}

Зверніться до підтримки, якщо проблема повторюється.`;
    }

    truncateText(text: string, maxLength: number = 4000): string {
        if (text.length <= maxLength) {
            return text;
        }
        
        // Try to truncate at sentence boundary
        const truncated = text.substring(0, maxLength - 3);
        const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
        );
        
        if (lastSentenceEnd > maxLength * 0.8) {
            return truncated.substring(0, lastSentenceEnd + 1) + '...';
        }
        
        return truncated + '...';
    }

    private escapeMarkdown(text: string): string {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/\*/g, '\\*')
            .replace(/_/g, '\\_')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/~/g, '\\~')
            .replace(/`/g, '\\`')
            .replace(/>/g, '\\>')
            .replace(/#/g, '\\#')
            .replace(/\+/g, '\\+')
            .replace(/-/g, '\\-')
            .replace(/=/g, '\\=')
            .replace(/\|/g, '\\|')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\./g, '\\.')
            .replace(/!/g, '\\!');
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('uk-UA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
