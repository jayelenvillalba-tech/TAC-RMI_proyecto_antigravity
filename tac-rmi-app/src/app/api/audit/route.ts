import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const logs = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
