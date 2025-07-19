import type { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import slug from 'slug'
import formidable from 'formidable'
import { v4 as uuid } from 'uuid'
import User from "../models/User"
import { checkPassword, hashPassword } from '../utils/auth'
import { generateJWT } from '../utils/jwt'
import cloudinary from '../config/cloudinary'
import Visit from '../models/Visit'
import { getDailyVisitActivity } from '../service/visitService'

/**
 * Crea una nueva cuenta de usuario.
 * Verifica email y nombre de usuario únicos, hashea contraseña y guarda en BD.
 */
export const createAccount = async (req: Request, res: Response) => {
    const { email, password } = req.body

    // Verificar email existente
    const userExists = await User.findOne({ email })
    if (userExists) {
        const error = new Error('Un usuario con ese mail ya esta registrado')
        return res.status(409).json({ error: error.message })
    }

    // Verificar nombre de usuario (handle)
    const handle = slug(req.body.handle, '')
    const handleExists = await User.findOne({ handle })
    if (handleExists) {
        const error = new Error('Nombre de usuario no disponible')
        return res.status(409).json({ error: error.message })
    }

    // Crear y guardar usuario
    const user = new User(req.body)
    user.password = await hashPassword(password)
    user.handle = handle
    await user.save()

    res.status(201).send('Registro Creado Correctamente')
}

/**
 * Inicia sesión de usuario.
 * Verifica existencia y contraseña, retorna token JWT.
 */
export const login = async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
        const error = new Error('El Usuario no existe')
        return res.status(404).json({ error: error.message })
    }

    const isPasswordCorrect = await checkPassword(password, user.password)
    if (!isPasswordCorrect) {
        const error = new Error('Password Incorrecto')
        return res.status(401).json({ error: error.message })
    }

    const token = generateJWT({ id: user._id })
    res.send(token)
}

/**
 * Retorna el usuario autenticado.
 */
export const getUser = async (req: Request, res: Response) => {
    res.json(req.user)
}

/**
 * Actualiza perfil del usuario autenticado.
 * Verifica que el nuevo handle sea único.
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { description, links } = req.body
        const handle = slug(req.body.handle, '')

        const handleExists = await User.findOne({ handle })
        if (handleExists && handleExists.email !== req.user.email) {
            const error = new Error('Nombre de usuario no disponible')
            return res.status(409).json({ error: error.message })
        }

        req.user.description = description
        req.user.handle = handle
        req.user.links = links
        await req.user.save()

        res.send('Perfil Actualizado Correctamente')
    } catch (e) {
        const error = new Error('Hubo un error')
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Sube imagen de perfil del usuario autenticado usando Cloudinary.
 */
export const uploadImage = async (req: Request, res: Response) => {
    const form = formidable({ multiples: false })
    try {
        form.parse(req, (error, fields, files) => {
            cloudinary.uploader.upload(files.file[0].filepath, { public_id: uuid() }, async (error, result) => {
                if (error) {
                    const error = new Error('Hubo un error al subir la imagen')
                    return res.status(500).json({ error: error.message })
                }

                if (result) {
                    req.user.image = result.secure_url
                    await req.user.save()
                    res.json({ image: result.secure_url })
                }
            })
        })
    } catch (e) {
        const error = new Error('Hubo un error')
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Obtiene perfil público de usuario por handle.
 * Incluye estadísticas de visitas y visitas recientes.
 */
export const getUserByHandle = async (req: Request, res: Response) => {
    try {
        const { handle } = req.params
        const user = await User.findOne({ handle }).select('-password -__v -email')
        if (!user) {
            return res.status(404).json({ error: 'El Usuario no existe' })
        }

        const totalUnique = await Visit.countDocuments({ profile: user._id })

        const recentVisits = await Visit.find({ profile: user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('visitor ip createdAt')

        res.json({
            ...user.toObject(),
            stats: {
                totalVisits: user.stats.totalVisits,
                uniqueVisitors: totalUnique,
                recentVisits
            }
        })
    } catch (e) {
        const error = new Error('Hubo un error')
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Verifica si un handle de usuario está disponible.
 */
export const searchByHandle = async (req: Request, res: Response) => {
    try {
        const { handle } = req.body
        const userExists = await User.findOne({ handle })
        if (userExists) {
            const error = new Error(`${handle} ya está registrado`)
            return res.status(409).json({ error: error.message })
        }

        res.send(`${handle} está disponible`)
    } catch (e) {
        const error = new Error('Hubo un error')
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Obtiene actividad diaria del perfil (visitas de hoy y resumen diario).
 */
export const getActivity = async (req: Request, res: Response) => {
    try {
        const { handle } = req.params
        const user = await User.findOne({ handle })
        if (!user) return res.status(404).json({ error: 'Perfil no encontrado' })

        // Rango de hoy
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const todayVisits = await Visit.countDocuments({
            profile: user._id,
            createdAt: { $gte: todayStart, $lte: todayEnd }
        })

        const dailyActivity = await getDailyVisitActivity(user._id.toString())

        res.json({
            today: todayVisits,
            dailyActivity
        })
    } catch (e) {
        const error = new Error('Error al obtener actividad')
        return res.status(500).json({ error: error.message })
    }
}
