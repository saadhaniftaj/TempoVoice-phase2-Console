import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envInfo = {
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      AWS_REGION: process.env.AWS_REGION || 'NOT SET',
      // Don't expose the actual secret value for security
      JWT_SECRET_PREVIEW: process.env.JWT_SECRET?.substring(0, 10) + '...' || 'NOT SET'
    };
    
    return NextResponse.json({ 
      message: 'Environment debug info',
      env: envInfo
    });

  } catch (error) {
    return NextResponse.json({ 
      message: 'Error',
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
