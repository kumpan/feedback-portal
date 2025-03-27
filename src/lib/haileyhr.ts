import { PrismaClient } from "@prisma/client";
import { generateMockEmployees } from "./mockEmployeeData";

let prisma: PrismaClient | undefined;

const getPrismaClient = async (): Promise<PrismaClient> => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

export type ApiKeyStatus =
  | "valid"
  | "expired"
  | "unknown"
  | "invalid"
  | "error";

export interface HaileyHREmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  updatedAt?: string;
}

export interface HaileyHRApiResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export interface ApiEmployeeData {
  id?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
  jobData?: {
    employment?: {
      dateOfJoining?: string;
      lastDayOfEmployment?: string | null;
      employments?: Array<{
        startDate?: string;
        endDate?: string | null;
      }>;
    };
    general?: {
      companyEmail?: string;
    };
  };
  personal?: {
    general?: {
      firstName?: string;
      lastName?: string;
      contactInformation?: {
        email?: string;
        privateEmail?: string;
      };
    };
    contactInformation?: {
      email?: string;
      privateEmail?: string;
    };
  };
  contactInformation?: {
    email?: string;
    privateEmail?: string;
  };
  accountStatus?: string;
  first_name?: string;
  last_name?: string;
  hire_date?: string;
  end_date?: string | null;
  is_active?: boolean;
  start_date?: string;
  joined_date?: string;
  joinedDate?: string;
  hireDate?: string;
  employmentStatus?: string;
  active?: boolean;
  dateOfJoining?: string;
  lastDayOfEmployment?: string;
  companyEmail?: string;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  message?: string;
  expiryDate?: Date;
}

export interface DatabaseEmployee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class HaileyHRApi {
  private apiKey: string;
  private accessToken: string;
  private baseUrl: string;
  private useMock: boolean;

  constructor(apiKey: string = "", useMock: boolean = false) {
    this.apiKey = apiKey || process.env.HAILEY_HR_API_KEY || "";
    this.accessToken = process.env.HAILEY_HR_ACCESS_TOKEN || "";
    this.baseUrl =
      process.env.HAILEY_HR_API_URL || "https://api.haileyhr.app/api/v1";
    this.useMock = useMock;

    console.log(
      `HaileyHRApi initialized with ${useMock ? "mock" : "real"} data mode`
    );
  }

  static transformEmployeeData(employee: HaileyHREmployee) {
    console.log("transformEmployeeData input:", {
      id: employee.id,
      firstName: employee.firstName,
      startDate: employee.startDate,
      endDate: employee.endDate,
      isActive: employee.isActive,
    });

    let startDate: Date;
    try {
      if (employee.startDate) {
        startDate = new Date(employee.startDate);
        if (isNaN(startDate.getTime())) {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          startDate = oneYearAgo;
          console.log(
            `Invalid start date for ${employee.id}, using default:`,
            startDate
          );
        } else {
          console.log(`Valid start date for ${employee.id}:`, startDate);
        }
      } else {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        startDate = oneYearAgo;
        console.log(
          `No start date for ${employee.id}, using default:`,
          startDate
        );
      }
    } catch {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      startDate = oneYearAgo;
      console.log(
        `Error parsing start date for ${employee.id}, using default:`,
        startDate
      );
    }

    let endDate: Date | null = null;
    if (employee.endDate) {
      try {
        const parsedEndDate = new Date(employee.endDate);
        if (!isNaN(parsedEndDate.getTime())) {
          endDate = parsedEndDate;
          console.log(`Valid end date for ${employee.id}:`, endDate);
        } else if (!employee.isActive) {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          endDate = threeMonthsAgo;
          console.log(
            `Invalid end date for inactive employee ${employee.id}, using default:`,
            endDate
          );
        }
      } catch {
        if (!employee.isActive) {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          endDate = threeMonthsAgo;
          console.log(
            `Error parsing end date for inactive employee ${employee.id}, using default:`,
            endDate
          );
        }
      }
    } else if (!employee.isActive) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      endDate = threeMonthsAgo;
      console.log(
        `No end date for inactive employee ${employee.id}, using default:`,
        endDate
      );
    }

    const result = {
      employeeId: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || "",
      startDate: startDate,
      endDate: endDate,
      isActive: employee.isActive,
    };

    console.log("transformEmployeeData output:", {
      employeeId: result.employeeId,
      firstName: result.firstName,
      startDate: result.startDate.toISOString().split("T")[0],
      endDate: result.endDate
        ? result.endDate.toISOString().split("T")[0]
        : null,
      isActive: result.isActive,
    });

    return result;
  }

  async isApiKeyValid(): Promise<ApiKeyValidationResult> {
    console.log(
      "isApiKeyValid called with API key:",
      this.apiKey ? "Present (masked)" : "Not provided"
    );

    if (!this.apiKey) {
      console.log("No API key provided, returning invalid");
      return {
        valid: false,
        message: "No API key provided",
        expiryDate: undefined,
      };
    }

    console.log("Checking for recent successful sync with this API key");

    try {
      const prisma = await getPrismaClient();

      interface SyncRecord {
        id: string;
        syncDate: Date;
        success: boolean;
        message: string | null;
        recordsAdded: number;
        recordsUpdated: number;
        apiKeyStatus: string;
        apiKeyExpiry: Date | null;
      }

      const lastSyncResult = await prisma.$queryRaw<SyncRecord[]>`
        SELECT * FROM "EmployeeDataSync"
        WHERE "apiKeyStatus" = 'valid' AND "success" = true
        ORDER BY "syncDate" DESC
        LIMIT 1
      `;

      console.log("Last sync result:", lastSyncResult);

      if (lastSyncResult && lastSyncResult.length > 0) {
        console.log("Found recent valid sync, API key is valid");
        const expiryDate = lastSyncResult[0].apiKeyExpiry
          ? new Date(lastSyncResult[0].apiKeyExpiry)
          : undefined;

        return {
          valid: true,
          expiryDate,
        };
      }

      console.log("No recent sync found, validating API key directly");

      try {
        const testEndpoint = `${this.baseUrl}/validate-key`;
        console.log(`Making test API call to: ${testEndpoint}`);

        const response = await fetch(testEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          console.log("API key validation successful");
          await this.updateApiKeyStatus(true);

          const responseData = await response.json();
          const expiryDate = responseData.expiryDate
            ? new Date(responseData.expiryDate)
            : undefined;

          return {
            valid: true,
            expiryDate,
          };
        } else {
          console.log(
            `API key validation failed with status: ${response.status}`
          );
          await this.updateApiKeyStatus(false);
          return {
            valid: false,
            message: `API key validation failed with status: ${response.status}`,
            expiryDate: undefined,
          };
        }
      } catch (error) {
        console.error("Error validating API key:", error);

        return {
          valid: false,
          message: "Could not validate API key",
          expiryDate: undefined,
        };
      }
    } catch (error) {
      console.error("Error checking recent syncs:", error);

      return {
        valid: false,
        message: "Error checking recent syncs",
        expiryDate: undefined,
      };
    }
  }

  async getEmployees(): Promise<HaileyHREmployee[]> {
    console.log("getEmployees called");

    if (this.useMock) {
      console.log("Using mock employee data for testing");
      const mockEmployees = generateMockEmployees(20);
      console.log(
        "Generated mock employees sample:",
        JSON.stringify(mockEmployees.slice(0, 1), null, 2)
      );

      const apiCompatibleEmployees: ApiEmployeeData[] = mockEmployees.map(
        (emp) => {
          const apiEmp: ApiEmployeeData = {
            ...emp,
            startDate: emp.startDate
              ? emp.startDate.toISOString().split("T")[0]
              : undefined,
            endDate: emp.endDate
              ? emp.endDate.toISOString().split("T")[0]
              : null,
            hire_date: emp.hire_date
              ? emp.hire_date.toISOString().split("T")[0]
              : undefined,
            end_date: emp.end_date
              ? emp.end_date.toISOString().split("T")[0]
              : null,
          };
          return apiEmp;
        }
      );

      return this.transformApiResponse(apiCompatibleEmployees);
    }

    const apiKeyStatus = await this.isApiKeyValid();

    console.log("getEmployees called, API key status:", apiKeyStatus);

    if (!apiKeyStatus.valid) {
      console.log("API key is not valid, returning empty array");
      throw new Error(
        "API key is not valid. Please provide a valid API key to fetch employee data."
      );
    }

    console.log("Fetching real employee data from Hailey HR API");

    if (this.accessToken) {
      const tokenLength = this.accessToken.length;
      const maskedToken =
        tokenLength > 10
          ? `${this.accessToken.substring(0, 3)}...${this.accessToken.substring(
              tokenLength - 3
            )}`
          : "***";
      console.log(`Using Access Token: ${maskedToken}`);
    } else {
      console.log("No access token available");
      throw new Error("Access token is required to fetch employee data");
    }

    const possibleEndpoints = [
      `${this.baseUrl}`,
      `${this.baseUrl}/employees`,
      `${this.baseUrl.replace("/api/v1", "")}/employees`,
      `${this.baseUrl.replace("/api/v1", "/v1")}/employees`,
      `${this.baseUrl}/employee`,
      `${this.baseUrl}/users`,
      `${this.baseUrl}/staff`,
      `${this.baseUrl}/personnel`,
    ];

    let lastError: Error | null = null;

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying API endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          console.log(`Found working endpoint: ${endpoint}`);
          const data = await response.json();

          if (typeof process !== "undefined" && process.env) {
            process.env.HAILEY_HR_API_ENDPOINT = endpoint;
          }

          let employees: HaileyHREmployee[] = [];

          if (Array.isArray(data)) {
            employees = this.transformApiResponse(data);
          } else if (data.employees && Array.isArray(data.employees)) {
            employees = this.transformApiResponse(data.employees);
          } else if (data.data && Array.isArray(data.data)) {
            employees = this.transformApiResponse(data.data);
          } else {
            throw new Error("Unexpected API response format");
          }

          return employees;
        }
      } catch (error) {
        console.error(`Error trying endpoint ${endpoint}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    console.error("All API endpoints failed");

    try {
      console.log(
        "Attempting to fetch employees from database as a last resort"
      );
      const dbEmployees = await this.getEmployeesFromDatabase();

      if (dbEmployees.length > 0) {
        console.log(`Found ${dbEmployees.length} employees in the database`);
        return dbEmployees;
      }
    } catch (dbError) {
      console.error("Error fetching from database:", dbError);
    }

    throw (
      lastError ||
      new Error("Failed to fetch employees from all possible sources")
    );
  }

  private transformApiResponse(data: ApiEmployeeData[]): HaileyHREmployee[] {
    console.log(
      "Raw API response data sample:",
      JSON.stringify(data.slice(0, 1), null, 2)
    );

    return data.map((employee: ApiEmployeeData) => {
      const employeeId =
        employee.employeeId ||
        employee.id ||
        `emp-${Math.random().toString(36).substr(2, 9)}`;

      const firstName = employee.firstName || employee.first_name || "";
      const lastName = employee.lastName || employee.last_name || "";

      let email = "";
      if (employee.companyEmail) {
        email = employee.companyEmail;
      } else if (employee.email) {
        email = employee.email;
      }

      let startDate = null;
      let endDate = null;

      if (employee.dateOfJoining) {
        startDate = employee.dateOfJoining;
        console.log(`Using dateOfJoining for ${employeeId}: ${startDate}`);
      }

      if (employee.lastDayOfEmployment) {
        endDate = employee.lastDayOfEmployment;
        console.log(`Using lastDayOfEmployment for ${employeeId}: ${endDate}`);
      }

      if (!startDate) {
        startDate =
          employee.startDate ||
          employee.start_date ||
          employee.hire_date ||
          employee.joined_date ||
          employee.joinedDate ||
          employee.hireDate;
        console.log(
          `Using fallback start date for ${employeeId}: ${startDate}`
        );
      }

      if (!endDate) {
        endDate = employee.endDate || employee.end_date;
        console.log(`Using fallback end date for ${employeeId}: ${endDate}`);
      }

      let isActive = true;
      if (
        employee.employmentStatus === "inactive" ||
        employee.accountStatus === "inactive" ||
        employee.is_active === false ||
        employee.active === false
      ) {
        isActive = false;
      }

      if (endDate && new Date(endDate) < new Date()) {
        isActive = false;
      }

      const transformedEmployee: HaileyHREmployee = {
        id: employeeId,
        firstName,
        lastName,
        email,
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate,
        isActive,
        updatedAt: new Date().toISOString(),
      };

      console.log(`Transformed employee ${employeeId}:`, {
        id: transformedEmployee.id,
        name: `${transformedEmployee.firstName} ${transformedEmployee.lastName}`,
        startDate: transformedEmployee.startDate,
        endDate: transformedEmployee.endDate,
        isActive: transformedEmployee.isActive,
      });

      return transformedEmployee;
    });
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  async clearEmployeeData(): Promise<void> {
    console.log("Clearing all employee data from database");
    try {
      const prisma = await getPrismaClient();
      await prisma.$executeRaw`
        DELETE FROM "Employee"
      `;
      console.log("All employee data cleared successfully");
    } catch (error) {
      console.error("Error clearing employee data:", error);
      throw error;
    }
  }

  async getEmployeesFromDatabase(): Promise<HaileyHREmployee[]> {
    console.log("Fetching employees from database");

    try {
      type EmployeeType = {
        id: number;
        employeeId: string;
        firstName: string;
        lastName: string;
        email: string;
        startDate: Date;
        endDate: Date | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      };

      const prisma = await getPrismaClient();
      const employees = await prisma.$queryRaw<EmployeeType[]>`
        SELECT * FROM "Employee"
      `;

      return employees.map((emp) => ({
        id: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        startDate: emp.startDate.toISOString().split("T")[0],
        endDate: emp.endDate ? emp.endDate.toISOString().split("T")[0] : null,
        isActive: emp.isActive,
        updatedAt: emp.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching employees from database:", error);
      return [];
    }
  }

  private async updateApiKeyStatus(isValid: boolean): Promise<void> {
    try {
      const prisma = await getPrismaClient();
      if (isValid) {
        await prisma.$executeRaw`
          INSERT INTO "EmployeeDataSync" (
            "syncDate",
            "success",
            "message",
            "recordsAdded",
            "recordsUpdated",
            "apiKeyStatus",
            "apiKeyExpiry"
          ) VALUES (
            NOW(),
            true,
            'API key validation successful',
            0,
            0,
            'valid',
            ${new Date(new Date().getFullYear() + 1, 11, 31)}
          )
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO "EmployeeDataSync" (
            "syncDate",
            "success",
            "message",
            "recordsAdded",
            "recordsUpdated",
            "apiKeyStatus",
            "apiKeyExpiry"
          ) VALUES (
            NOW(),
            false,
            'API key validation failed',
            0,
            0,
            'invalid',
            NULL
          )
        `;
      }
    } catch (error) {
      console.error("Error updating API key status:", error);
    }
  }

  async getEmployeeChangesByYear(year: number): Promise<{
    startedEmployees: HaileyHREmployee[];
    leftEmployees: HaileyHREmployee[];
  }> {
    const allEmployees = await this.getEmployees();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const startedEmployees = allEmployees.filter((emp) => {
      const empStartDate = new Date(emp.startDate);
      return empStartDate >= startDate && empStartDate <= endDate;
    });

    const leftEmployees = allEmployees.filter((emp) => {
      if (!emp.endDate) return false;
      const empEndDate = new Date(emp.endDate);
      return empEndDate >= startDate && empEndDate <= endDate;
    });

    return { startedEmployees, leftEmployees };
  }
}
