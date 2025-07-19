import Visit from '../models/Visit'
import mongoose from 'mongoose'

/**
 * Obtiene la cantidad diaria de visitas a un perfil durante los últimos 6 meses.
 *
 * @param profileId - ID del perfil del usuario (como string).
 * @returns Un array de objetos con la fecha (`date`) y la cantidad de visitas (`count`) por día.
 *
 * Ejemplo de salida:
 * [
 *   { date: "2025-02-12", count: 4 },
 *   { date: "2025-02-13", count: 2 },
 *   ...
 * ]
 */
export async function getDailyVisitActivity(profileId: string) {
    const results = await Visit.aggregate([
        // Filtra visitas del perfil especificado dentro de los últimos 6 meses
        {
            $match: {
                profile: new mongoose.Types.ObjectId(profileId),
                createdAt: {
                    $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // Fecha actual menos 180 días (~6 meses)
                }
            }
        },
        // Agrupa por fecha (YYYY-MM-DD) y cuenta las visitas por día
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } // Normaliza a formato de fecha
                },
                count: { $sum: 1 }
            }
        },
        // Proyecta el resultado final con los campos `date` y `count`
        {
            $project: {
                _id: 0,
                date: '$_id',
                count: 1
            }
        },
        // Ordena cronológicamente de menor a mayor
        {
            $sort: { date: 1 }
        }
    ])

    // Devuelve los resultados como objetos planos
    return results.map(item => ({
        date: item.date,
        count: item.count
    }))
}
