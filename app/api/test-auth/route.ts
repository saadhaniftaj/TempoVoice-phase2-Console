import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../src/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing authentication...');
    
    // Check authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid Bearer token found');
      return NextResponse.json({ 
        message: 'Unauthorized - No Bearer token',
        authHeader: authHeader 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Token:', token.substring(0, 20) + '...');
    
    const authService = new AuthService();
    const user = authService.verifyToken(token);
    
    if (!user) {
      console.log('❌ Token verification failed');
      return NextResponse.json({ 
        message: 'Unauthorized - Token verification failed',
        token: token.substring(0, 20) + '...'
      }, { status: 401 });
    }

    console.log('✅ Authentication successful:', user);
    return NextResponse.json({ 
      message: 'Authentication successful',
      user: user
    });

  } catch (error) {
    console.error('❌ Authentication error:', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}
