import { Router } from 'express'
import { body } from 'express-validator'
import {
    createAccount,
    getActivity,
    getUser,
    getUserByHandle,
    login,
    searchByHandle,
    updateProfile,
    uploadImage
} from './handlers'
import { handleInputErrors } from './middleware/validation'
import { authenticate } from './middleware/auth'
import { trackVisit } from './middleware/visitTracker'

const router = Router()

/** 
 * @section Autenticación y Registro
 * Rutas para registrar nuevos usuarios y hacer login.
 */

// Registro de usuario nuevo
router.post('/auth/register',
    // Validaciones del body
    body('handle').notEmpty().withMessage('El handle no puede ir vacio'),
    body('name').notEmpty().withMessage('El Nombre no puede ir vacio'),
    body('email').isEmail().withMessage('E-mail no válido'),
    body('password').isLength({ min: 8 }).withMessage('El Password es muy corto, mínimo 8 caracteres'),
    handleInputErrors, // Middleware de validación
    createAccount // Handler principal
)

// Login de usuario
router.post('/auth/login',
    body('email').isEmail().withMessage('E-mail no válido'),
    body('password').notEmpty().withMessage('El Password es obligatorio'),
    handleInputErrors,
    login
)

/**
 * @section Perfil de Usuario
 * Obtener, actualizar perfil, subir imagen.
 */

// Obtener perfil del usuario autenticado
router.get('/user', authenticate, getUser)

// Actualizar el perfil del usuario autenticado
router.patch('/user',
    body('handle').notEmpty().withMessage('El handle no puede ir vacio'),
    handleInputErrors,
    authenticate,
    updateProfile
)

// Subir o actualizar imagen de perfil
router.post('/user/image', authenticate, uploadImage)

/**
 * @section Perfiles públicos y búsqueda
 */

// Obtener perfil público por handle (y registrar visita)
router.get('/:handle', trackVisit, getUserByHandle)

// Buscar perfiles por handle (desde barra de búsqueda u otro input)
router.post('/search',
    body('handle').notEmpty().withMessage('El handle no puede ir vacio'),
    handleInputErrors,
    searchByHandle
)

/**
 * @section Estadísticas
 */

// Obtener actividad del usuario (visitas, clics, etc.)
router.get('/stats/activity/:handle', authenticate, getActivity)

export default router
