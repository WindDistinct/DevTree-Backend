import { Request, Response, NextFunction } from 'express'
import User from '../models/User'
import Visit from '../models/Visit'
import mongoose from 'mongoose'

/**
 * Middleware que registra una visita a un perfil público (por `handle`).
 *
 * - Incrementa el contador de visitas totales (`stats.totalVisits`).
 * - Registra historial de visita (`stats.visitHistory`) con timestamp e ID/IP.
 * - Si el visitante está logueado, se añade a los visitantes únicos.
 * - Guarda la visita en la colección `Visit` para análisis posterior.
 *
 * No registra visitas si:
 * - El perfil no existe.
 * - El usuario visita su propio perfil.
 */
export const trackVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { handle } = req.params
        const visitorId = req.user?._id?.toString()
        const ip = req.ip

        // Busca el perfil por handle
        const profile = await User.findOne({ handle })
        if (!profile) return next()

        // Ignora si el visitante es el dueño del perfil
        if (visitorId && visitorId === profile._id.toString()) return next()

        // Prepara la actualización de estadísticas
        const updateOps: any = {
            $inc: { 'stats.totalVisits': 1 },
            $push: {
                'stats.visitHistory': {
                    visitorId: visitorId || undefined,
                    timestamp: new Date()
                }
            }
        }

        // Añade visitante único si está logueado
        if (visitorId) {
            updateOps.$addToSet = { 'stats.uniqueVisitors': visitorId }
        }

        // Aplica actualización al perfil
        await User.updateOne({ _id: profile._id }, updateOps)

        // Crea un registro en la colección de visitas
        await Visit.create({
            profile: profile._id,
            visitor: visitorId ? new mongoose.Types.ObjectId(visitorId) : undefined,
            ip: visitorId ? undefined : ip
        })

        next()
    } catch (error) {
        console.error('Error en trackVisit:', error)
        next()
    }
}
