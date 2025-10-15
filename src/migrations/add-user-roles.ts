import { MongoClient } from 'mongodb';
import { ConfigService } from '../config/ConfigService';

/**
 * Migration script to add role and isBlocked fields to existing users
 * Run this script once after deploying the admin role feature
 */
async function migrateUserRoles() {
    const config = new ConfigService();
    const mongoUri = config.get('MONGO_URI');
    
    // Get owner ID (first admin from ADMIN_IDS or separate OWNER_ID)
    let ownerId: string | undefined;
    try {
        ownerId = config.get('OWNER_ID');
    } catch {
        // If OWNER_ID not set, use first ADMIN_ID as owner
        const adminIds = config.get('ADMIN_IDS')?.split(',').map(id => id.trim()) || [];
        if (adminIds.length > 0) {
            ownerId = adminIds[0];
        }
    }
    
    const adminIds = config.get('ADMIN_IDS')?.split(',').map(id => id.trim()).filter(id => id !== ownerId) || [];

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

        // Set OWNER role for the main admin
        if (ownerId) {
            const ownerUpdateResult = await usersCollection.updateMany(
                { _id: { $in: [ownerId] } } as any,
                { $set: { role: 'OWNER', isBlocked: false } }
            );

            console.log(`Set OWNER role for ${ownerUpdateResult.modifiedCount} user(s)`);
            console.log(`Owner ID: ${ownerId}`);
        }

        // Set admin role for other specified admin IDs
        if (adminIds.length > 0) {
            const adminUpdateResult = await usersCollection.updateMany(
                { _id: { $in: adminIds } } as any,
                { $set: { role: 'ADMIN', isBlocked: false } }
            );

            console.log(`Set ADMIN role for ${adminUpdateResult.modifiedCount} user(s)`);
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

