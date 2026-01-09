
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const secretKey = process.env.AUTH_SECRET || 'default-secret-key-change-me'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(key)
}

export async function decrypt(input) {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        return null
    }
}

export async function hashPassword(password) {
    return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword)
}

export async function createSession(userId) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    const session = await encrypt({ userId, expires })
    const cookieStore = await cookies()

    cookieStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        sameSite: 'lax',
        path: '/',
    })
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    if (!session) return null
    return await decrypt(session)
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}
