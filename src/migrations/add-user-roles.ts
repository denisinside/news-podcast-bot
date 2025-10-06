import { MongoClient } from 'mongodb';
import { ConfigService } from '../config/ConfigService';

/**
 * Migration script to add role and isBlocked fields to existing users
 * Run this script once after deploying the admin role feature
 */
async function migrateUserRoles() {
    const config = new ConfigService();
    const mongoUri = config.get('MONGO_URI');
    const adminIds = config.get('ADMIN_IDS')?.split(',').map(id => id.trim()) || [];

    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const usersCollection = db.collection('users');

        // Update all users without role field to USER
        const updateResult = await usersCollection.updateMany(
            { role: { $exists: false } },
            { 
                $set: { 
                    role: 'USER',
                    isBlocked: false
                } 
            }
        );

        console.log(`Updated ${updateResult.modifiedCount} users with default role`);

        // Set admin role for specified admin IDs
        if (adminIds.length > 0) {
            const adminUpdateResult = await usersCollection.updateMany(
                { _id: { $in: adminIds } } as any,
                { $set: { role: 'ADMIN' } }
            );

            console.log(`Set ADMIN role for ${adminUpdateResult.modifiedCount} users`);
            console.log(`Admin IDs: ${adminIds.join(', ')}`);
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateUserRoles()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { migrateUserRoles };

