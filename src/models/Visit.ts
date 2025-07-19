import mongoose, { Schema, Document } from 'mongoose'

export interface IVisit extends Document {
    profile: mongoose.Types.ObjectId       // ID del perfil visitado
    visitor?: mongoose.Types.ObjectId      // ID del visitante logueado
    ip?: string                            // Dirección IP del visitante anónimo
    createdAt: Date                        // Fecha de creación de la visita
}

const visitSchema = new Schema<IVisit>({
    profile: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Usuario que recibe la visita
    visitor: { type: Schema.Types.ObjectId, ref: 'User' },                 // Usuario que visita (si está autenticado)
    ip: String,                                                            // IP del visitante anónimo
    createdAt: { type: Date, default: Date.now }                           // Timestamp automático de creación
})

/**
 * @index
 * Evita duplicadas:
 * - Un usuario autenticado no puede registrar múltiples visitas al mismo perfil.
 * - Un visitante anónimo (por IP) tampoco puede hacerlo.
 * 
 * `sparse` permite que la unicidad se aplique solo si el campo existe (para que no choque entre `visitor` e `ip`)
 */
visitSchema.index({ profile: 1, visitor: 1 }, { unique: true, sparse: true })
visitSchema.index({ profile: 1, ip: 1 }, { unique: true, sparse: true })

// Exporta el modelo Visit para interactuar con la colección "visits"
const Visit = mongoose.model<IVisit>('Visit', visitSchema)
export default Visit
