import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
    handle: string
    name: string
    email: string
    password: string
    description: string
    image: string
    links: string
    stats: {
        totalVisits: number
        uniqueVisitors: string[]
        visitHistory: Array<{
            visitorId?: string
            timestamp: Date
        }>
    }
}

const userSchema = new Schema({
    handle: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    links: {
        type: String,
        default: '[]'
    },
    stats: {
        totalVisits: { type: Number, default: 0 },
        uniqueVisitors: { type: [String], default: [] },
        visitHistory: {
            type: [{
                visitorId: { type: String, required: false },
                timestamp: { type: Date, default: Date.now }
            }],
            default: []
        }
    }
}, { timestamps: true });

const User = mongoose.model<IUser>('User', userSchema)
export default User