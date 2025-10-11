import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const secret = process.env.JWT_SECRET || 'tempovoice-super-secret-jwt-key-2024';
    
    return NextResponse.json({ 
      message: 'JWT Secret info',
      actualSecret: secret,
      expectedSecret: 'tempovoice-super-secret-jwt-key-2024',
      match: secret === 'tempovoice-super-secret-jwt-key-2024'
    });

  } catch (error) {
    return NextResponse.json({ 
      message: 'Error',
      error: error.message 
    }, { status: 500 });
  }
}
