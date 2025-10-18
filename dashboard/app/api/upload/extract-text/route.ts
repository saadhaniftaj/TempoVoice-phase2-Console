import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs-extra';
import path from 'path';
import mammoth from 'mammoth';

// Dynamic import for pdf-parse to avoid server-side issues
const getPdfParser = async () => {
  try {
    // Use dynamic import with proper handling
    const pdfParseModule = await import('pdf-parse');
    // Handle both default and named exports
    return pdfParseModule.default || pdfParseModule;
  } catch (error) {
    console.error('Failed to import pdf-parse:', error);
    throw new Error('PDF parsing library not available');
  }
};

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Allowed file types and their MIME types
const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
};

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, TXT, MD, or CSV files.' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let extractedText = '';

    try {
      // Extract text based on file type
      switch (fileType) {
        case 'pdf':
          try {
            const pdfParse = await getPdfParser();
            console.log('PDF parser type:', typeof pdfParse);
            console.log('PDF parser keys:', Object.keys(pdfParse || {}));
            
            if (typeof pdfParse !== 'function') {
              throw new Error('PDF parser is not a function');
            }
            
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text;
          } catch (pdfError) {
            console.error('PDF parsing error:', pdfError);
            throw new Error('Failed to parse PDF. The file may be corrupted, password-protected, or contain images only.');
          }
          break;
          
        case 'docx':
          const docxResult = await mammoth.extractRawText({ buffer });
          extractedText = docxResult.value;
          break;
          
        case 'txt':
        case 'md':
        case 'csv':
          extractedText = buffer.toString('utf-8');
          break;
          
        default:
          throw new Error('Unsupported file type');
      }

      // Clean up the extracted text
      extractedText = extractedText
        .replace(/\r\n/g, '\n')           // Normalize line endings
        .replace(/\n{3,}/g, '\n\n')       // Remove excessive line breaks
        .replace(/[ \t]+/g, ' ')          // Normalize spaces
        .trim();                          // Remove leading/trailing whitespace

      // Validate extracted text
      if (!extractedText || extractedText.length < 10) {
        return NextResponse.json(
          { error: 'No readable text found in the file' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        text: extractedText,
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType,
        textLength: extractedText.length,
      });

    } catch (extractionError) {
      console.error('Text extraction error:', extractionError);
      return NextResponse.json(
        { error: 'Failed to extract text from file. The file may be corrupted or password-protected.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}