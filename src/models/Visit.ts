import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
    profile: mongoose.Types.ObjectId;
    visitor?: mongoose.Types.ObjectId; // usuario logueado
    ip?: string; // usuario anónimo
    createdAt: Date;
}

const visitSchema = new Schema<IVisit>({
    profile: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visitor: { type: Schema.Types.ObjectId, ref: 'User' },
    ip: String,
    createdAt: { type: Date, default: Date.now }
});

visitSchema.index({ profile: 1, visitor: 1 }, { unique: true, sparse: true });
visitSchema.index({ profile: 1, ip: 1 }, { unique: true, sparse: true });

const Visit = mongoose.model<IVisit>('Visit', visitSchema);
export default Visit;
