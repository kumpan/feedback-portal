'use server';

import { prisma } from "@/lib/prisma";
import { HaileyHRApi, HaileyHREmployee } from "@/lib/haileyhr";

export interface EmployeeRetentionData {
  startOfYearCount: number;
  endOfYearCount: number;
  retentionRate: number;
  originalEmployeesRetained: number;
  originalEmployeeRetentionRate: number;
  averageEmploymentDuration: number; // in years
  year: number;
  lastSyncDate: Date | null;
  apiKeyStatus: 'valid' | 'expired' | 'unknown';
}

// Define interfaces for our employee data
interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date;
}

interface EmployeeDataSync {
  id: string;
  syncDate: Date;
  success: boolean;
  errorMessage: string | null;
  recordsAdded: number;
  recordsUpdated: number;
  apiKeyExpiry: Date | null;
}

/**
 * Sync employee data from Hailey HR API to our database
 */
export async function syncEmployeeData(): Promise<{
  success: boolean;
  message: string;
  recordsAdded: number;
  recordsUpdated: number;
  apiKeyExpiry?: Date;
}> {
  const api = new HaileyHRApi();
  let recordsAdded = 0;
  let recordsUpdated = 0;
  let apiKeyExpiry: Date | undefined;
  
  try {
    // Check if API key is valid
    const apiKeyStatus = await api.isApiKeyValid();
    
    if (!apiKeyStatus.valid) {
      // Use the Prisma client directly to create a sync record
      await prisma.$executeRaw`
        INSERT INTO "EmployeeDataSync" ("id", "syncDate", "success", "errorMessage", "recordsAdded", "recordsUpdated")
        VALUES (gen_random_uuid(), NOW(), false, 'Invalid or expired API key', 0, 0)
      `;
      
      return {
        success: false,
        message: 'Invalid or expired API key',
        recordsAdded: 0,
        recordsUpdated: 0
      };
    }
    
    apiKeyExpiry = apiKeyStatus.expiryDate;
    
    // Fetch employees from Hailey HR
    const employees = await api.getEmployees();
    
    // Process each employee
    for (const employee of employees) {
      const transformedEmployee = HaileyHRApi.transformEmployeeData(employee);
      
      // Check if employee already exists in our database
      const existingEmployee = await prisma.$queryRaw<Employee[]>`
        SELECT * FROM "Employee" WHERE "employeeId" = ${employee.id} LIMIT 1
      `;
      
      if (existingEmployee.length > 0) {
        // Update existing employee
        await prisma.$executeRaw`
          UPDATE "Employee"
          SET 
            "firstName" = ${transformedEmployee.firstName},
            "lastName" = ${transformedEmployee.lastName},
            "email" = ${transformedEmployee.email},
            "startDate" = ${transformedEmployee.startDate},
            "endDate" = ${transformedEmployee.endDate},
            "isActive" = ${transformedEmployee.isActive},
            "updatedAt" = NOW(),
            "syncedAt" = NOW()
          WHERE "id" = ${existingEmployee[0].id}
        `;
        recordsUpdated++;
      } else {
        // Create new employee
        await prisma.$executeRaw`
          INSERT INTO "Employee" ("id", "employeeId", "firstName", "lastName", "email", "startDate", "endDate", "isActive", "createdAt", "updatedAt", "syncedAt")
          VALUES (
            gen_random_uuid(),
            ${transformedEmployee.employeeId},
            ${transformedEmployee.firstName},
            ${transformedEmployee.lastName},
            ${transformedEmployee.email},
            ${transformedEmployee.startDate},
            ${transformedEmployee.endDate},
            ${transformedEmployee.isActive},
            NOW(),
            NOW(),
            NOW()
          )
        `;
        recordsAdded++;
      }
    }
    
    // Log the sync
    await prisma.$executeRaw`
      INSERT INTO "EmployeeDataSync" ("id", "syncDate", "success", "recordsAdded", "recordsUpdated", "apiKeyExpiry")
      VALUES (gen_random_uuid(), NOW(), true, ${recordsAdded}, ${recordsUpdated}, ${apiKeyExpiry})
    `;
    
    return {
      success: true,
      message: `Successfully synced ${recordsAdded + recordsUpdated} employees (${recordsAdded} added, ${recordsUpdated} updated)`,
      recordsAdded,
      recordsUpdated,
      apiKeyExpiry
    };
  } catch (error) {
    console.error('Error syncing employee data:', error);
    
    // Log the error
    await prisma.$executeRaw`
      INSERT INTO "EmployeeDataSync" ("id", "syncDate", "success", "errorMessage", "recordsAdded", "recordsUpdated", "apiKeyExpiry")
      VALUES (
        gen_random_uuid(), 
        NOW(), 
        false, 
        ${error instanceof Error ? error.message : 'Unknown error'}, 
        ${recordsAdded}, 
        ${recordsUpdated}, 
        ${apiKeyExpiry}
      )
    `;
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      recordsAdded,
      recordsUpdated,
      apiKeyExpiry
    };
  }
}

/**
 * Get employee retention data for a specific year
 */
export async function getEmployeeRetentionData(year: number = new Date().getFullYear()): Promise<EmployeeRetentionData> {
  // Get the last sync information
  const lastSync = await prisma.$queryRaw<EmployeeDataSync[]>`
    SELECT * FROM "EmployeeDataSync" ORDER BY "syncDate" DESC LIMIT 1
  `;
  
  // Check API key status
  let apiKeyStatus: 'valid' | 'expired' | 'unknown' = 'unknown';
  if (lastSync.length > 0) {
    if (lastSync[0].apiKeyExpiry) {
      apiKeyStatus = lastSync[0].apiKeyExpiry > new Date() ? 'valid' : 'expired';
    }
  }
  
  // Define start and end dates for the year
  const startOfYear = new Date(year, 0, 1); // January 1st
  const endOfYear = new Date(year, 11, 31, 23, 59, 59); // December 31st 23:59:59
  
  // Get employees at the start of the year
  const employeesAtStart = await prisma.$queryRaw<Employee[]>`
    SELECT * FROM "Employee"
    WHERE "startDate" <= ${startOfYear}
    AND ("endDate" IS NULL OR "endDate" > ${startOfYear})
  `;
  
  // Get employees at the end of the year
  const employeesAtEnd = await prisma.$queryRaw<Employee[]>`
    SELECT * FROM "Employee"
    WHERE "startDate" <= ${endOfYear}
    AND ("endDate" IS NULL OR "endDate" > ${endOfYear})
  `;
  
  // Count original employees who stayed throughout the year
  const originalEmployeesRetained = employeesAtEnd.filter(employee => 
    employeesAtStart.some(startEmployee => startEmployee.id === employee.id)
  ).length;
  
  // Calculate average employment duration in years
  const now = new Date();
  let totalDuration = 0;
  
  const allEmployees = await prisma.$queryRaw<Employee[]>`
    SELECT * FROM "Employee"
  `;
  
  for (const employee of allEmployees) {
    const endDate = employee.endDate || now;
    const durationMs = endDate.getTime() - employee.startDate.getTime();
    const durationYears = durationMs / (1000 * 60 * 60 * 24 * 365.25);
    totalDuration += durationYears;
  }
  
  const averageEmploymentDuration = allEmployees.length > 0 
    ? totalDuration / allEmployees.length 
    : 0;
  
  // Calculate retention rates
  const startOfYearCount = employeesAtStart.length;
  const endOfYearCount = employeesAtEnd.length;
  
  const retentionRate = startOfYearCount > 0 
    ? (endOfYearCount / startOfYearCount) * 100 
    : 0;
    
  const originalEmployeeRetentionRate = startOfYearCount > 0 
    ? (originalEmployeesRetained / startOfYearCount) * 100 
    : 0;
  
  return {
    startOfYearCount,
    endOfYearCount,
    retentionRate,
    originalEmployeesRetained,
    originalEmployeeRetentionRate,
    averageEmploymentDuration,
    year,
    lastSyncDate: lastSync.length > 0 ? lastSync[0].syncDate : null,
    apiKeyStatus
  };
}
