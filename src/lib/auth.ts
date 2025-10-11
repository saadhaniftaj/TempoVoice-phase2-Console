import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../../app/generated/prisma';
import { User } from '../types';

const prisma = new PrismaClient();

function getJWTSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key';
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId ?? undefined,
      },
      getJWTSecret(),
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): { id: string; email: string; role: 'ADMIN' | 'DEVELOPER'; tenantId?: string } | null {
    try {
      return jwt.verify(token, getJWTSecret()) as { id: string; email: string; role: 'ADMIN' | 'DEVELOPER'; tenantId?: string };
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    const token = this.generateToken(user as unknown as User);
    return { user: user as unknown as User, token };
  }

  async register(email: string, password: string, role: 'ADMIN' | 'DEVELOPER', tenantId?: string): Promise<{ user: User; token: string }> {
    const passwordHash = await this.hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        tenantId: tenantId ?? null,
      }
    });

    const token = this.generateToken(user as unknown as User);
    return { user: user as unknown as User, token };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return user as unknown as User;
  }
}
