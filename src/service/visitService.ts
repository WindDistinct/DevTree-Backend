import Visit from '../models/Visit';
import mongoose from 'mongoose';

export async function getDailyVisitActivity(profileId: string) {
    const results = await Visit.aggregate([
        {
            $match: {
                profile: new mongoose.Types.ObjectId(profileId),
                createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } // Últimos 6 meses
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                date: "$_id",
                count: 1
            }
        },
        { $sort: { date: 1 } }
    ]);

    return results.map(item => ({
        date: item.date,
        count: item.count
    }));
}