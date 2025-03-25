import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all employees from the database
    const employees = await prisma.employee.findMany({
      orderBy: {
        startDate: 'asc',
      },
    });

    // Format dates for better readability
    const formattedEmployees = employees.map((emp) => ({
      ...emp,
      startDate: emp.startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      endDate: emp.endDate ? emp.endDate.toISOString().split('T')[0] : null,
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      count: employees.length,
      employees: formattedEmployees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch employees",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
