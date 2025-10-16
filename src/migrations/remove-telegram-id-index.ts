import { MongoClient } from 'mongodb';
import { ConfigService } from '../config/ConfigService';

async function removeTelegramIdIndex() {
    const config = new ConfigService();
    const mongoUri = config.get('MONGO_URI');
    
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const usersCollection = db.collection('users');

        // List all indexes
        const indexes = await usersCollection.indexes();
        console.log('Current indexes:', indexes);

        // Try to drop the telegramId index
        try {
            await usersCollection.dropIndex('telegramId_1');
            console.log('Successfully dropped telegramId_1 index');
        } catch (error: any) {
            console.log('Index telegramId_1 not found or already dropped:', error.message);
        }

        // List indexes again to confirm
        const indexesAfter = await usersCollection.indexes();
        console.log('Indexes after removal:', indexesAfter);

        console.log('Index removal completed!');
    } catch (error) {
        console.error('Error removing index:', error);
        throw error;
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run if this file is executed directly
if (require.main === module) {
    removeTelegramIdIndex()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { removeTelegramIdIndex };
