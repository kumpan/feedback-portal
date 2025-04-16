import { NextRequest, NextResponse } from "next/server";
import { syncEmployeeData } from "@/app/actions/employeeActions";
import { HaileyHRApi } from "@/lib/haileyhr";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const forceFullSync = body.forceFullSync || false;
    const useMock = body.useMock || false;

    console.log(
      `Sync request received: forceFullSync=${forceFullSync}, useMock=${useMock}`
    );

    if (useMock) {
      console.log("Using mock data for testing");

      if (forceFullSync) {
        await prisma.employee.deleteMany({
          where: {},
        });
        console.log("Cleared all existing employee data");
      }

      const api = new HaileyHRApi("test-api-key", true);
      const employees = await api.getEmployees();
      console.log(`Fetched ${employees.length} mock employees`);

      let recordsAdded = 0;
      let recordsUpdated = 0;

      for (const employee of employees) {
        const transformedEmployee = HaileyHRApi.transformEmployeeData(employee);

        const existingEmployee = await prisma.employee.findUnique({
          where: { employeeId: transformedEmployee.employeeId },
        });

        if (existingEmployee) {
          console.log(
            `Updating employee ${transformedEmployee.employeeId} (${transformedEmployee.firstName} ${transformedEmployee.lastName})`
          );
          await prisma.employee.update({
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
            `Creating new employee ${transformedEmployee.employeeId} (${transformedEmployee.firstName} ${transformedEmployee.lastName})`
          );
          await prisma.employee.create({
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

      await prisma.employeeDataSync.create({
        data: {
          syncDate: new Date(),
          success: true,
          message: "Mock data sync completed successfully",
          recordsAdded,
          recordsUpdated,
          apiKeyStatus: "valid",
          apiKeyExpiry: new Date("2025-12-31"),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully synced ${employees.length} mock employees (${recordsAdded} added, ${recordsUpdated} updated)`,
        recordsAdded,
        recordsUpdated,
        apiKeyExpiry: new Date("2025-12-31"),
        apiKeyStatus: "valid",
      });
    } else {
      const result = await syncEmployeeData(forceFullSync);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error syncing employees:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        recordsAdded: 0,
        recordsUpdated: 0,
        apiKeyStatus: "error",
      },
      { status: 500 }
    );
  }
}
