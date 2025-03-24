// Hailey HR API integration

export interface HaileyHREmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface HaileyHRApiResponse {
  employees: HaileyHREmployee[];
  success: boolean;
  message?: string;
}

export class HaileyHRApi {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.HAILEY_HR_API_KEY || '';
    this.baseUrl = 'https://api.haileyhr.app';
    
    if (!this.apiKey) {
      console.warn('HAILEY_HR_API_KEY is not set in environment variables');
    }
  }
  
  async getEmployees(): Promise<HaileyHREmployee[]> {
    try {
      if (!this.apiKey) {
        throw new Error('HAILEY_HR_API_KEY is not set');
      }
      
      const response = await fetch(`${this.baseUrl}/employees`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch employees: ${response.status} ${errorText}`);
      }
      
      const data = await response.json() as HaileyHRApiResponse;
      
      if (!data.success) {
        throw new Error(`API returned error: ${data.message}`);
      }
      
      return data.employees;
    } catch (error) {
      console.error('Error fetching employees from Hailey HR:', error);
      throw error;
    }
  }
  
  // Transform Hailey HR employee data to our database model
  static transformEmployeeData(employee: HaileyHREmployee): { 
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
  } {
    return {
      employeeId: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || null,
      startDate: new Date(employee.startDate),
      endDate: employee.endDate ? new Date(employee.endDate) : null,
      isActive: employee.isActive,
    };
  }
  
  // Check if the API key is valid
  async isApiKeyValid(): Promise<{ valid: boolean; expiryDate?: Date }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        return { valid: false };
      }
      
      const data = await response.json();
      
      // Assuming the API returns expiry information
      const expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
      
      return { 
        valid: true,
        expiryDate
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return { valid: false };
    }
  }
}
