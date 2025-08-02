import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

export interface QRCodeData {
  id: number;
  type: 'student' | 'child';
  schoolId: number;
  name: string;
  code: string; // Unique identifier
  timestamp: number;
}

/**
 * Generate a unique QR code for a student or child
 */
export async function generateStudentQRCode(
  id: number,
  type: 'student' | 'child',
  schoolId: number,
  name: string
): Promise<{ qrCode: string; qrCodeData: string }> {
  // Generate unique code
  const uniqueCode = nanoid(12);
  
  // Create QR code data
  const qrData: QRCodeData = {
    id,
    type,
    schoolId,
    name,
    code: uniqueCode,
    timestamp: Date.now()
  };
  
  // Convert to JSON string
  const qrCodeData = JSON.stringify(qrData);
  
  // Generate QR code as data URL
  const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return {
    qrCode: qrCodeImage,
    qrCodeData
  };
}

/**
 * Parse QR code data to extract student/child information
 */
export function parseQRCodeData(qrCodeData: string): QRCodeData | null {
  try {
    const data = JSON.parse(qrCodeData);
    
    // Validate required fields
    if (!data.id || !data.type || !data.schoolId || !data.code) {
      return null;
    }
    
    return data as QRCodeData;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
}

/**
 * Verify if QR code belongs to a specific school
 */
export function verifyQRCodeSchool(qrCodeData: string, schoolId: number): boolean {
  const data = parseQRCodeData(qrCodeData);
  return data ? data.schoolId === schoolId : false;
}

/**
 * Get QR code for attendance scanning
 */
export function getAttendanceQRData(qrCodeData: string): { studentId: number; type: 'student' | 'child' } | null {
  const data = parseQRCodeData(qrCodeData);
  if (!data) return null;
  
  return {
    studentId: data.id,
    type: data.type
  };
}