import { IMessageTemplateService } from "../interfaces/IMessageTemplateService";
import { IArticle } from "@/models";

export class MessageTemplateService implements IMessageTemplateService {
    
    formatNewsNotification(article: IArticle, topicName: string): { text: string; imageUrl?: string; url?: string } {
        const truncatedContent = this.truncateText(article.content, 1000);
        
        const message = `🔹 *${article.title}*

📝 ${truncatedContent}

📰 ${topicName}
📅 ${this.formatDate(article.publicationDate)}`;

        return {
            text: this.truncateText(message, 4000),
            imageUrl: article.url,
            url: article.source
        };
    }

    formatPodcastNotification(podcastUrl: string, topics: string[], duration?: string): string {
        const topicsList = topics.map(topic => `• ${topic}`).join('\n');
        const durationText = duration ? `\n⏱️ Тривалість: ${duration}` : '';
        
        const message = `🎙️ *Ваш персональний подкаст готовий!*

📋 *Теми в подкасті:*
${topicsList}${durationText}`;

        return this.truncateText(message, 4000);
    }

    formatErrorNotification(error: string): string {
        return `❌ *Помилка*

${error}

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
