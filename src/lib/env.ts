export const env = {
  HAILEY_HR_API_KEY: process.env.HAILEY_HR_API_KEY,

  DATABASE_URL: process.env.DATABASE_URL || "",

  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
};

export function validateEnv() {
  const requiredEnvVars = [
    "DATABASE_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "HAILEY_HR_API_KEY",
    "HAILEY_HR_ACCESS_TOKEN",
    "HAILEY_HR_API_URL",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (key) => !env[key as keyof typeof env]
  );

  if (missingEnvVars.length > 0) {
    console.warn(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
  }

  if (!env.HAILEY_HR_API_KEY) {
    console.warn(
      "HAILEY_HR_API_KEY is not set. Employee data features will be limited to database records only."
    );
  }

  return missingEnvVars.length === 0;
}
