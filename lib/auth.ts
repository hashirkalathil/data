import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.AUTH_SECRET || 'your-secret-key-change-me';

if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === 'your-secret-key-change-me')) {
    console.warn('[SECURITY WARNING] AUTH_SECRET is not configured or using default placeholder. Please set a secure random AUTH_SECRET in your environment variables.');
}

const key = new TextEncoder().encode(SECRET_KEY);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // Session duration
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}
