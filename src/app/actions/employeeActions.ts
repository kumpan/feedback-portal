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
  console.log("Startar synkronisering av personaldata...");

  const apiKey = process.env.HAILEY_HR_API_KEY;
  console.log(
    `API-nyckel från miljö: ${
      apiKey ? "Present (maskerad)" : "Inte närvarande"
    }`
  );

  const api = new HaileyHRApi(apiKey);
  console.log("Skapade HaileyHRApi-instans");

  let recordsAdded = 0;
  let recordsUpdated = 0;
  let apiKeyExpiry: Date | undefined;

  try {
    console.log("Kontrollerar om API-nyckeln är giltig...");
    const apiKeyStatus: ApiKeyValidationResult = await api.isApiKeyValid();
    console.log("API-nyckelvalideringsresultat:", apiKeyStatus);

    if (!apiKeyStatus.valid) {
      console.log(
        "API-nyckeln är inte giltig, loggar synkroniseringsförsök med fel"
      );

      await prismaWithModels.employeeDataSync.create({
        data: {
          syncDate: new Date(),
          success: false,
          message: apiKeyStatus.message || "Ogiltig API-nyckel",
          recordsAdded: 0,
          recordsUpdated: 0,
          apiKeyStatus: "expired",
          apiKeyExpiry: apiKeyStatus.expiryDate || null,
        },
      });

      return {
        success: false,
        message: apiKeyStatus.message || "Ogiltig API-nyckel",
        recordsAdded: 0,
        recordsUpdated: 0,
        apiKeyStatus: "expired",
      };
    }

    apiKeyExpiry = apiKeyStatus.expiryDate;
    console.log("API-nyckeln är giltig, utgångsdatum:", apiKeyExpiry);

    if (forceFullSync) {
      console.log(
        "Tvingad fullständig synkronisering begärd, rensar all befintlig personaldata"
      );
      await prismaWithModels.employee.deleteMany({
        where: {},
      });
    }

    let lastSuccessfulSync = null;
    if (!forceFullSync) {
      console.log("Kontrollerar efter senaste lyckad synkronisering...");
      lastSuccessfulSync = await prismaWithModels.employeeDataSync.findFirst({
        where: {
          success: true,
          apiKeyStatus: "valid",
        },
        orderBy: { syncDate: "desc" },
      });
      console.log("Senaste lyckad synkronisering:", lastSuccessfulSync);
    }

    console.log("Hämtar anställda från Hailey HR API...");
    const employees = await api.getEmployees();
    console.log(`Hämtade ${employees.length} anställda från API`);

    if (lastSuccessfulSync && !forceFullSync) {
      console.log(
        `Utför inkrementell synkronisering sedan ${lastSuccessfulSync.syncDate}`
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
              `Uppdaterar anställd ${employee.id} (${employee.firstName} ${employee.lastName})`
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
            `Skapar ny anställd ${employee.id} (${employee.firstName} ${employee.lastName})`
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
      console.log("Utför fullständig synkronisering");

      for (const employee of employees) {
        const transformedEmployee = HaileyHRApi.transformEmployeeData(employee);

        const existingEmployee = await prismaWithModels.employee.findUnique({
          where: { employeeId: employee.id },
        });

        if (existingEmployee) {
          console.log(
            `Uppdaterar anställd ${employee.id} (${employee.firstName} ${employee.lastName})`
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
            `Skapar ny anställd ${employee.id} (${employee.firstName} ${employee.lastName})`
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
        message: `Synkronisering slutförd: ${
          recordsAdded + recordsUpdated
        } anställda (${recordsAdded} tillagda, ${recordsUpdated} uppdaterade)`,
        recordsAdded,
        recordsUpdated,
        apiKeyStatus: apiKeyStatus.valid ? "valid" : "invalid",
        apiKeyExpiry: apiKeyStatus.expiryDate || null,
      },
    });

    return {
      success: true,
      message: `Synkronisering slutförd: ${
        recordsAdded + recordsUpdated
      } anställda (${recordsAdded} tillagda, ${recordsUpdated} uppdaterade)`,
      recordsAdded,
      recordsUpdated,
      apiKeyExpiry,
      apiKeyStatus: apiKeyStatus.valid ? "valid" : "invalid",
    };
  } catch (error) {
    console.error("Fel vid synkronisering av personaldata:", error);

    await prismaWithModels.employeeDataSync.create({
      data: {
        syncDate: new Date(),
        success: false,
        message: error instanceof Error ? error.message : "Okänt fel",
        recordsAdded,
        recordsUpdated,
        apiKeyStatus: "error",
        apiKeyExpiry: null,
      },
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : "Okänt fel",
      recordsAdded,
      recordsUpdated,
      apiKeyStatus: "error",
    };
  }
}

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
    console.error("Fel vid hämtning av personalretentionsdata:", error);
    throw error;
  }
}

/**
 * Kontrollera status för Hailey HR API-nyckel
 */
export async function checkApiKeyStatus(): Promise<ApiKeyStatus> {
  const apiKey = process.env.HAILEY_HR_API_KEY;
  const api = new HaileyHRApi(apiKey);
  const apiKeyStatus: ApiKeyValidationResult = await api.isApiKeyValid();
  return apiKeyStatus.valid ? "valid" : "expired";
}

/**
 * Hämta senaste synkroniseringsdatum och status
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
    console.error(
      "Fel vid hämtning av senaste synkroniseringsinformation:",
      error
    );
    return { date: null, status: "none" };
  }
}
