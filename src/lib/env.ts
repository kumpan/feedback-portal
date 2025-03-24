// Environment variables configuration
export const env = {
  // Hailey HR API
  HAILEY_HR_API_KEY: process.env.HAILEY_HR_API_KEY || '',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
};

// Validate required environment variables
export function validateEnv() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];
  
  const missingEnvVars = requiredEnvVars.filter(key => !env[key as keyof typeof env]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
  
  // Warn about optional but important variables
  if (!env.HAILEY_HR_API_KEY) {
    console.warn('HAILEY_HR_API_KEY is not set. Employee data features will be limited to database records only.');
  }
  
  return missingEnvVars.length === 0;
}
