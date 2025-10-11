import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZ2p3NXhuNzAwMDA4b2hrM2xsd20xNm8iLCJlbWFpbCI6ImFkbWluQHRlbXBvdm9pY2UuY29tIiwicm9sZSI6IkFETUlOIiwidGVuYW50SWQiOiJ0ZW5hbnQtYWRtaW4iLCJpYXQiOjE3NjAxNDA4NTYsImV4cCI6MTc2MDc0NTY1Nn0.G6QZVvF5Nz1Qa7-kTivx2WIE2-CSdNObdL2Js863bFc';
    const secret = process.env.JWT_SECRET || 'tempovoice-super-secret-jwt-key-2024';
    
    console.log('🔍 JWT Debug in Next.js:');
    console.log('Secret length:', secret.length);
    console.log('Secret preview:', secret.substring(0, 10) + '...');
    
    let result;
    try {
      result = jwt.verify(token, secret);
      console.log('✅ JWT verification successful');
    } catch (error) {
      console.log('❌ JWT verification failed:', error instanceof Error ? error.message : String(error));
      result = { error: error instanceof Error ? error.message : String(error) };
    }
    
    // Also decode without verification
    const decoded = jwt.decode(token);
    
    return NextResponse.json({ 
      message: 'JWT debug info',
      secretLength: secret.length,
      secretPreview: secret.substring(0, 10) + '...',
      verificationResult: result,
      decodedPayload: decoded
    });

  } catch (error) {
    return NextResponse.json({ 
      message: 'Error',
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
