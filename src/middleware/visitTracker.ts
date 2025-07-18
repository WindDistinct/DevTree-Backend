import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Visit from '../models/Visit';

export const trackVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { handle } = req.params;
        const visitorId = req.user?._id?.toString() || null;
        const ip = req.ip;

        const profile = await User.findOne({ handle });
        if (!profile) return next();

        if (visitorId && visitorId === profile._id.toString()) return next();

        await User.updateOne({ _id: profile._id }, { $inc: { 'stats.totalVisits': 1 } });

        const existingVisit = await Visit.findOne({
            profile: profile._id,
            ...(visitorId ? { visitor: visitorId } : { ip })
        });

        if (!existingVisit) {
            await Visit.create({
                profile: profile._id,
                visitor: visitorId || undefined,
                ip: visitorId ? undefined : ip
            });
        }

        next();
    } catch (error) {
        console.error('Error en trackVisit:', error);
        next();
    }
};
