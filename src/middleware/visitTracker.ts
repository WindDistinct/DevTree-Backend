import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Visit from '../models/Visit';
import mongoose from 'mongoose';

export const trackVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { handle } = req.params;
        const visitorId = req.user?._id?.toString();
        const ip = req.ip;

        const profile = await User.findOne({ handle });
        if (!profile) return next();

        if (visitorId && visitorId === profile._id.toString()) return next();

        const updateOps: any = {
            $inc: { 'stats.totalVisits': 1 },
            $push: {
                'stats.visitHistory': {
                    visitorId: visitorId || undefined,
                    timestamp: new Date()
                }
            }
        };

        if (visitorId) {
            updateOps.$addToSet = { 'stats.uniqueVisitors': visitorId };
        }

        await User.updateOne({ _id: profile._id }, updateOps);

        await Visit.create({
            profile: profile._id,
            visitor: visitorId ? new mongoose.Types.ObjectId(visitorId) : undefined,
            ip: visitorId ? undefined : ip
        });

        next();
    } catch (error) {
        console.error('Error en trackVisit:', error);
        next();
    }
};