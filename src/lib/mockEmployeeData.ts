// Define different types for the different employee formats
interface BaseEmployee {
  id?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  startDate?: Date;
  endDate?: Date | null;
  hire_date?: Date;
  end_date?: Date | null;
  isActive?: boolean;
  is_active?: boolean;
}

interface HaileyEmployee extends BaseEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  jobData: {
    employment: {
      dateOfJoining: string;
      lastDayOfEmployment: string | null;
      employments: [
        {
          startDate: string;
          endDate: string | null;
        }
      ];
    };
    general: {
      companyEmail: string;
    };
  };
  personal: {
    general: {
      firstName: string;
      lastName: string;
    };
  };
  accountStatus: string;
}

interface StandardEmployee extends BaseEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
}

interface LegacyEmployee extends BaseEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  hire_date: Date;
  end_date: Date | null;
  is_active: boolean;
}

export function generateMockEmployees(count: number = 10): BaseEmployee[] {
  console.log(
    `Generating ${count} mock employees with varied start and end dates`
  );

  const employees: BaseEmployee[] = [];

  const today = new Date();

  for (let i = 0; i < count; i++) {
    const startYearsAgo = Math.random() * 5;
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - Math.floor(startYearsAgo));
    startDate.setMonth(today.getMonth() - Math.floor(Math.random() * 12));

    const isActive = Math.random() < 0.7;

    let endDate = null;
    if (!isActive) {
      const endDateMs =
        startDate.getTime() +
        Math.random() * (today.getTime() - startDate.getTime());
      endDate = new Date(endDateMs);
    }

    if (i % 3 === 0) {
      // Hailey HR format
      const haileyEmployee: HaileyEmployee = {
        employeeId: `emp-${i}-${Math.random().toString(36).substring(2, 9)}`,
        firstName: `FirstName${i}`,
        lastName: `LastName${i}`,
        email: `employee${i}@example.com`,
        jobData: {
          employment: {
            dateOfJoining: startDate.toISOString().split("T")[0],
            lastDayOfEmployment: endDate
              ? endDate.toISOString().split("T")[0]
              : null,
            employments: [
              {
                startDate: startDate.toISOString().split("T")[0],
                endDate: endDate ? endDate.toISOString().split("T")[0] : null,
              },
            ],
          },
          general: {
            companyEmail: `employee${i}@company.com`,
          },
        },
        personal: {
          general: {
            firstName: `FirstName${i}`,
            lastName: `LastName${i}`,
          },
        },
        accountStatus: isActive ? "Active" : "Inactive",
      };
      employees.push(haileyEmployee);
    } else if (i % 3 === 1) {
      // Standard format
      const standardEmployee: StandardEmployee = {
        id: `emp-${i}-${Math.random().toString(36).substring(2, 9)}`,
        firstName: `FirstName${i}`,
        lastName: `LastName${i}`,
        email: `employee${i}@example.com`,
        startDate: startDate,
        endDate: endDate,
        isActive: isActive,
      };
      employees.push(standardEmployee);
    } else {
      // Legacy format
      const legacyEmployee: LegacyEmployee = {
        id: `emp-${i}-${Math.random().toString(36).substring(2, 9)}`,
        first_name: `FirstName${i}`,
        last_name: `LastName${i}`,
        email: `employee${i}@example.com`,
        hire_date: startDate,
        end_date: endDate,
        is_active: isActive,
      };
      employees.push(legacyEmployee);
    }
  }

  return employees;
}
