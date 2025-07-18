import Visit from '../models/Visit';
import mongoose from 'mongoose';

export async function getDailyVisitActivity(profileId: string) {
    const results = await Visit.aggregate([
        {
            $match: {
                profile: new mongoose.Types.ObjectId(profileId),
                createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day'
                    }
                },
                count: 1
            }
        },
        {
            $sort: { date: 1 }
        }
    ]);

    return results; // [{ date: '2025-07-15T00:00:00Z', count: 3 }, ...]
}
