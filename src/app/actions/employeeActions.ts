"use server";

import { prisma } from "@/lib/prisma";
import {
  HaileyHRApi,
  ApiKeyStatus,
  ApiKeyValidationResult,
} from "@/lib/haileyhr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaWithModels = prisma as any;

export interface EmployeeRetentionData {
  startOfYearCount: number;
  endOfYearCount: number;
  retentionRate: number;
  originalEmployeesRetained: number;
  originalEmployeeRetentionRate: number;
  averageEmploymentDuration: number;
  year: number;
  lastSyncDate: Date | null;
  apiKeyStatus: ApiKeyStatus;
}

export interface SyncResult {
  success: boolean;
  message: string;
  recordsAdded: number;
  recordsUpdated: number;
  apiKeyExpiry?: Date;
  apiKeyStatus: ApiKeyStatus;
}

export async function syncEmployeeData(
  forceFullSync: boolean = false
): Promise<SyncResult> {
  console.log("Starting syncEmployeeData function...");

  const apiKey = process.env.HAILEY_HR_API_KEY;
  console.log(
    `API Key from environment: ${apiKey ? "Present (masked)" : "Not present"}`
  );

  const api = new HaileyHRApi(apiKey);
  console.log("Created HaileyHRApi instance");

  let recordsAdded = 0;
  let recordsUpdated = 0;
  let apiKeyExpiry: Date | undefined;

  try {
    console.log("Checking if API key is valid...");
    const apiKeyStatus: ApiKeyValidationResult = await api.isApiKeyValid();
    console.log("API key validation result:", apiKeyStatus);

    if (!apiKeyStatus.valid) {
      console.log("API key is not valid, logging sync attempt with failure");

      await prismaWithModels.employeeDataSync.create({
        data: {
          syncDate: new Date(),
          success: false,
          message: apiKeyStatus.message || "Invalid or expired API key",
          recordsAdded: 0,
          recordsUpdated: 0,
          apiKeyStatus: "expired",
          apiKeyExpiry: apiKeyStatus.expiryDate || null,
        },
      });

      return {
        success: false,
        message: apiKeyStatus.message || "Invalid or expired API key",
        recordsAdded: 0,
        recordsUpdated: 0,
        apiKeyStatus: "expired",
      };
    }

    apiKeyExpiry = apiKeyStatus.expiryDate;
    console.log("API key is valid, expiry date:", apiKeyExpiry);

    if (forceFullSync) {
      console.log(
        "Force full sync requested, clearing all existing employee data"
      );
      await prismaWithModels.employee.deleteMany({
        where: {},
      });
    }

    let lastSuccessfulSync = null;
    if (!forceFullSync) {
      console.log("Checking for last successful sync...");
      lastSuccessfulSync = await prismaWithModels.employeeDataSync.findFirst({
        where: {
          success: true,
          apiKeyStatus: "valid",
        },
        orderBy: { syncDate: "desc" },
      });
      console.log("Last successful sync:", lastSuccessfulSync);
    }

    console.log("Fetching employees from Hailey HR API...");
    const employees = await api.getEmployees();
    console.log(`Fetched ${employees.length} employees from API`);

    if (lastSuccessfulSync && !forceFullSync) {
      console.log(
        `Performing incremental sync since ${lastSuccessfulSync.syncDate}`
      );

      const lastSyncDate = lastSuccessfulSync.syncDate;

      for (const employee of employees) {
        const transformedEmployee = HaileyHRApi.transformEmployeeData(employee);

        const existingEmployee = await prismaWithModels.employee.findUnique({
          where: { employeeId: employee.id },
        });

        if (existingEmployee) {
          const employeeLastUpdated = new Date(
            employee.updatedAt || employee.startDate
          );

          if (
            employeeLastUpdated > lastSyncDate ||
            existingEmployee.isActive !== transformedEmployee.isActive ||
            (existingEmployee.endDate === null &&
              transformedEmployee.endDate !== null) ||
            (existingEmployee.endDate !== null &&
              transformedEmployee.endDate === null) ||
            (existingEmployee.endDate &&
              transformedEmployee.endDate &&
              existingEmployee.endDate.getTime() !==
                transformedEmployee.endDate.getTime())
          ) {
            console.log(
              `Updating employee ${employee.id} (${employee.firstName} ${employee.lastName})`
            );
            await prismaWithModels.employee.update({
              where: { id: existingEmployee.id },
              data: {
                firstName: transformedEmployee.firstName,
                lastName: transformedEmployee.lastName,
                email: transformedEmployee.email,
                startDate: transformedEmployee.startDate,
                endDate: transformedEmployee.endDate,
                isActive: transformedEmployee.isActive,
              },
            });
            recordsUpdated++;
          }
        } else {
          console.log(
            `Creating new employee ${employee.id} (${employee.firstName} ${employee.lastName})`
          );
          await prismaWithModels.employee.create({
            data: {
              employeeId: transformedEmployee.employeeId,
              firstName: transformedEmployee.firstName,
              lastName: transformedEmployee.lastName,
              email: transformedEmployee.email,
              startDate: transformedEmployee.startDate,
              endDate: transformedEmployee.endDate,
              isActive: transformedEmployee.isActive,
            },
          });
          recordsAdded++;
        }
      }
    } else {
      console.log("Performing full sync");

      for (const employee of employees) {
        const transformedEmployee = HaileyHRApi.transformEmployeeData(employee);

        const existingEmployee = await prismaWithModels.employee.findUnique({
          where: { employeeId: employee.id },
        });

        if (existingEmployee) {
          console.log(
            `Updating employee ${employee.id} (${employee.firstName} ${employee.lastName})`
          );
          await prismaWithModels.employee.update({
            where: { id: existingEmployee.id },
            data: {
              firstName: transformedEmployee.firstName,
              lastName: transformedEmployee.lastName,
              email: transformedEmployee.email,
              startDate: transformedEmployee.startDate,
              endDate: transformedEmployee.endDate,
              isActive: transformedEmployee.isActive,
            },
          });
          recordsUpdated++;
        } else {
          console.log(
            `Creating new employee ${employee.id} (${employee.firstName} ${employee.lastName})`
          );
          await prismaWithModels.employee.create({
            data: {
              employeeId: transformedEmployee.employeeId,
              firstName: transformedEmployee.firstName,
              lastName: transformedEmployee.lastName,
              email: transformedEmployee.email,
              startDate: transformedEmployee.startDate,
              endDate: transformedEmployee.endDate,
              isActive: transformedEmployee.isActive,
            },
          });
          recordsAdded++;
        }
      }
    }

    await prismaWithModels.employeeDataSync.create({
      data: {
        syncDate: new Date(),
        success: true,
        message: `Successfully synced ${
          recordsAdded + recordsUpdated
        } employees (${recordsAdded} added, ${recordsUpdated} updated)`,
        recordsAdded,
        recordsUpdated,
        apiKeyStatus: apiKeyStatus.valid ? "valid" : "invalid",
        apiKeyExpiry: apiKeyStatus.expiryDate || null,
      },
    });

    return {
      success: true,
      message: `Successfully synced ${
        recordsAdded + recordsUpdated
      } employees (${recordsAdded} added, ${recordsUpdated} updated)`,
      recordsAdded,
      recordsUpdated,
      apiKeyExpiry,
      apiKeyStatus: apiKeyStatus.valid ? "valid" : "invalid",
    };
  } catch (error) {
    console.error("Error syncing employee data:", error);

    await prismaWithModels.employeeDataSync.create({
      data: {
        syncDate: new Date(),
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        recordsAdded,
        recordsUpdated,
        apiKeyStatus: "error",
        apiKeyExpiry: null,
      },
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      recordsAdded,
      recordsUpdated,
      apiKeyStatus: "error",
    };
  }
}

/**
 * Get employee retention data for a specific year
 * @param year The year to get retention data for
 */
export async function getEmployeeRetentionData(
  year: number
): Promise<EmployeeRetentionData> {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const startOfYearEmployees = await prismaWithModels.employee.findMany({
      where: {
        startDate: { lte: startDate },
        OR: [{ endDate: null }, { endDate: { gt: startDate } }],
      },
    });

    const endOfYearEmployees = await prismaWithModels.employee.findMany({
      where: {
        startDate: { lte: endDate },
        OR: [{ endDate: null }, { endDate: { gt: endDate } }],
      },
    });

    const retainedEmployees = await prismaWithModels.employee.findMany({
      where: {
        startDate: { lte: startDate },
        OR: [{ endDate: null }, { endDate: { gt: endDate } }],
      },
    });

    const allEmployeesInYear = await prismaWithModels.employee.findMany({
      where: {
        OR: [
          {
            startDate: {
              lte: endDate,
              gte: startDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            startDate: { lte: startDate },
            OR: [{ endDate: null }, { endDate: { gte: endDate } }],
          },
        ],
      },
    });

    const startOfYearCount = startOfYearEmployees.length;
    const endOfYearCount = endOfYearEmployees.length;
    const originalEmployeesRetained = retainedEmployees.length;

    const retentionRate =
      startOfYearCount > 0 ? (endOfYearCount / startOfYearCount) * 100 : 0;
    const originalEmployeeRetentionRate =
      startOfYearCount > 0
        ? (originalEmployeesRetained / startOfYearCount) * 100
        : 0;

    let totalDurationInDays = 0;
    for (const employee of allEmployeesInYear) {
      const startDateToUse = new Date(
        Math.max(employee.startDate.getTime(), startDate.getTime())
      );
      const endDateToUse = employee.endDate
        ? new Date(Math.min(employee.endDate.getTime(), endDate.getTime()))
        : endDate;

      const durationInDays =
        (endDateToUse.getTime() - startDateToUse.getTime()) /
        (1000 * 60 * 60 * 24);
      totalDurationInDays += durationInDays;
    }

    const averageEmploymentDuration =
      allEmployeesInYear.length > 0
        ? totalDurationInDays / allEmployeesInYear.length / 365
        : 0;

    const lastSync = await prismaWithModels.employeeDataSync.findFirst({
      orderBy: { syncDate: "desc" },
    });

    const apiKeyStatus: ApiKeyStatus = lastSync
      ? (lastSync.apiKeyStatus as ApiKeyStatus)
      : "unknown";

    return {
      startOfYearCount,
      endOfYearCount,
      retentionRate,
      originalEmployeesRetained,
      originalEmployeeRetentionRate,
      averageEmploymentDuration,
      year,
      lastSyncDate: lastSync ? lastSync.syncDate : null,
      apiKeyStatus,
    };
  } catch (error) {
    console.error("Error getting employee retention data:", error);
    throw error;
  }
}

/**
 * Check the status of the Hailey HR API key
 */
export async function checkApiKeyStatus(): Promise<ApiKeyStatus> {
  const apiKey = process.env.HAILEY_HR_API_KEY;
  const api = new HaileyHRApi(apiKey);
  const apiKeyStatus: ApiKeyValidationResult = await api.isApiKeyValid();
  return apiKeyStatus.valid ? "valid" : "expired";
}

/**
 * Get the last sync date and status
 */
export async function getLastSyncInfo(): Promise<{
  date: Date | null;
  status: "success" | "failed" | "none";
}> {
  try {
    const lastSync = await prismaWithModels.employeeDataSync.findFirst({
      orderBy: { syncDate: "desc" },
    });

    if (!lastSync) {
      return { date: null, status: "none" };
    }

    return {
      date: lastSync.syncDate,
      status: lastSync.success ? "success" : "failed",
    };
  } catch (error) {
    console.error("Error getting last sync info:", error);
    return { date: null, status: "none" };
  }
}
