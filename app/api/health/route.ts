import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check - just return OK
    // Database migration should happen before the app starts
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'TempoVoice Dashboard',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      service: 'TempoVoice Dashboard',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
