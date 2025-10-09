import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, tenantId } = await request.json() as { email?: string; password?: string; role?: 'ADMIN' | 'DEVELOPER'; tenantId?: string };

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'DEVELOPER'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be ADMIN or DEVELOPER' },
        { status: 400 }
      );
    }

    const result = await authService.register(email, password, role, tenantId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Registration error:', error);

    const hasCode = (e: unknown): e is { code: string } => {
      return typeof (e as { code?: unknown }).code === 'string';
    };

    if (hasCode(error) && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
