import { PrismaClient } from "@prisma/client";
import { generateMockEmployees } from "./mockEmployeeData";

let prisma: PrismaClient | undefined;

const getPrismaClient = async (): Promise<PrismaClient> => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

export type ApiKeyStatus = "valid" | "expired" | "unknown" | "invalid" | "error";

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

    console.log(`HaileyHRApi initialized with ${useMock ? 'mock' : 'real'} data mode`);
  }

  static transformEmployeeData(employee: HaileyHREmployee) {
    console.log("transformEmployeeData input:", {
      id: employee.id,
      firstName: employee.firstName,
      startDate: employee.startDate,
      endDate: employee.endDate,
      isActive: employee.isActive
    });

    // Process start date
    let startDate: Date;
    try {
      if (employee.startDate) {
        startDate = new Date(employee.startDate);
        if (isNaN(startDate.getTime())) {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          startDate = oneYearAgo;
          console.log(`Invalid start date for ${employee.id}, using default:`, startDate);
        } else {
          console.log(`Valid start date for ${employee.id}:`, startDate);
        }
      } else {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        startDate = oneYearAgo;
        console.log(`No start date for ${employee.id}, using default:`, startDate);
      }
    } catch {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      startDate = oneYearAgo;
      console.log(`Error parsing start date for ${employee.id}, using default:`, startDate);
    }

    // Process end date
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
          console.log(`Invalid end date for inactive employee ${employee.id}, using default:`, endDate);
        }
      } catch {
        if (!employee.isActive) {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          endDate = threeMonthsAgo;
          console.log(`Error parsing end date for inactive employee ${employee.id}, using default:`, endDate);
        }
      }
    } else if (!employee.isActive) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      endDate = threeMonthsAgo;
      console.log(`No end date for inactive employee ${employee.id}, using default:`, endDate);
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
      startDate: result.startDate.toISOString().split('T')[0],
      endDate: result.endDate ? result.endDate.toISOString().split('T')[0] : null,
      isActive: result.isActive
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

    // If using mock data, return mock employees
    if (this.useMock) {
      console.log("Using mock employee data for testing");
      const mockEmployees = generateMockEmployees(20);
      console.log("Generated mock employees sample:", JSON.stringify(mockEmployees.slice(0, 1), null, 2));
      
      // Convert BaseEmployee[] to ApiEmployeeData[]
      const apiCompatibleEmployees: ApiEmployeeData[] = mockEmployees.map(emp => {
        // Convert Date objects to strings
        const apiEmp: ApiEmployeeData = {
          ...emp,
          startDate: emp.startDate ? emp.startDate.toISOString().split('T')[0] : undefined,
          endDate: emp.endDate ? emp.endDate.toISOString().split('T')[0] : null,
          hire_date: emp.hire_date ? emp.hire_date.toISOString().split('T')[0] : undefined,
          end_date: emp.end_date ? emp.end_date.toISOString().split('T')[0] : null
        };
        return apiEmp;
      });
      
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
    console.log("Raw API response data sample:", JSON.stringify(data.slice(0, 1), null, 2));
    
    return data.map((employee: ApiEmployeeData) => {
      // Extract start date from the correct location in the API response
      let startDate = null;
      let endDate = null;
      const employeeId = (employee.employeeId as string) || (employee.id as string) || `emp-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`Processing employee ${employeeId} data structure:`, 
        employee.jobData ? 'Has jobData' : 'No jobData',
        employee.jobData?.employment ? 'Has employment data' : 'No employment data'
      );
      
      // Check if we have the detailed structure from the single employee endpoint
      if (employee.jobData && employee.jobData.employment) {
        console.log(`Employee ${employeeId} employment data:`, {
          dateOfJoining: employee.jobData.employment.dateOfJoining,
          lastDayOfEmployment: employee.jobData.employment.lastDayOfEmployment,
          hasEmployments: employee.jobData.employment.employments && employee.jobData.employment.employments.length > 0
        });
        
        // Primary start date from dateOfJoining
        startDate = employee.jobData.employment.dateOfJoining;
        
        // Primary end date from lastDayOfEmployment
        endDate = employee.jobData.employment.lastDayOfEmployment;
        
        // If no start date found, try to get it from the first employment
        if (!startDate && employee.jobData.employment.employments && 
            employee.jobData.employment.employments.length > 0) {
          startDate = employee.jobData.employment.employments[0].startDate;
          console.log(`Using first employment start date for ${employeeId}: ${startDate}`);
        }
        
        // If no end date found and employee is not active, try to get it from the last employment
        if (!endDate && employee.jobData.employment.employments && 
            employee.jobData.employment.employments.length > 0) {
          const lastEmployment = employee.jobData.employment.employments[
            employee.jobData.employment.employments.length - 1
          ];
          endDate = lastEmployment.endDate;
          console.log(`Using last employment end date for ${employeeId}: ${endDate}`);
        }
      } else {
        // Fallback to the old fields for backward compatibility
        startDate = employee.startDate || employee.start_date;
        endDate = employee.endDate || employee.end_date;
        console.log(`Using fallback date fields for ${employeeId}: startDate=${startDate}, endDate=${endDate}`);
      }
      
      // Additional fallbacks for start date
      if (!startDate || !this.isValidDate(startDate)) {
        const fallbackStartDate = 
          employee.hire_date ||
          employee.joined_date ||
          employee.hireDate ||
          employee.joinedDate;
        
        if (fallbackStartDate && this.isValidDate(fallbackStartDate)) {
          startDate = fallbackStartDate;
          console.log(`Using alternative start date field for ${employeeId}: ${startDate}`);
        } else {
          // Only use default if we couldn't find any valid date
          const today = new Date();
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(today.getFullYear() - 1);
          startDate = oneYearAgo.toISOString().split("T")[0];
          console.log(`No valid start date found for ${employeeId}, using default: ${startDate}`);
        }
      }

      // Ensure startDate is properly formatted
      if (startDate && this.isValidDate(startDate)) {
        const originalStartDate = startDate;
        startDate = new Date(startDate).toISOString().split("T")[0];
        console.log(`Formatted start date for ${employeeId}: ${originalStartDate} -> ${startDate}`);
      }

      // Process end date
      const isActive = 
        employee.accountStatus === "Active" ||
        employee.employmentStatus === "Active" ||
        employee.isActive === true || 
        employee.is_active === true || 
        employee.active === true;
      
      console.log(`Employee ${employeeId} active status: ${isActive}`);
      
      if (endDate && this.isValidDate(endDate)) {
        const originalEndDate = endDate;
        endDate = new Date(endDate).toISOString().split("T")[0];
        console.log(`Formatted end date for ${employeeId}: ${originalEndDate} -> ${endDate}`);
      } else if (!isActive) {
        // Only use default end date for inactive employees without a valid end date
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        endDate = threeMonthsAgo.toISOString().split("T")[0];
        console.log(`No valid end date found for inactive employee ${employeeId}, using default: ${endDate}`);
      } else {
        endDate = null;
        console.log(`Active employee ${employeeId} has no end date`);
      }

      // Get name from appropriate location
      let firstName = "";
      let lastName = "";
      
      if (employee.personal && employee.personal.general) {
        firstName = employee.personal.general.firstName || "";
        lastName = employee.personal.general.lastName || "";
      } else {
        firstName = employee.firstName || employee.first_name || "";
        lastName = employee.lastName || employee.last_name || "";
      }
      
      // Get email from appropriate location
      let email = "";
      if (employee.jobData && employee.jobData.general) {
        email = employee.jobData.general.companyEmail || "";
      } else if (employee.personal && employee.personal.contactInformation) {
        email = employee.personal.contactInformation.privateEmail || "";
      } else {
        email = employee.email || "";
      }

      const transformedEmployee = {
        id: employeeId,
        firstName,
        lastName,
        email,
        startDate,
        endDate,
        isActive,
      };
      
      console.log(`Transformed employee ${employeeId}:`, {
        firstName: transformedEmployee.firstName,
        startDate: transformedEmployee.startDate,
        endDate: transformedEmployee.endDate,
        isActive: transformedEmployee.isActive
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
