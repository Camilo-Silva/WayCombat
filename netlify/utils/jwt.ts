import jwt from 'jsonwebtoken';
import { Usuario } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'waycombat-secret-key-change-in-production';

export interface TokenPayload {
  id: number;
  email: string;
  rol: string;
  nombre: string;
}

export function generateToken(usuario: Usuario): string {
  const payload: TokenPayload = {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}