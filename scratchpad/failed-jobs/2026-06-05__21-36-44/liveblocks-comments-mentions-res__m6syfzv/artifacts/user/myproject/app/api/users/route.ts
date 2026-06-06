import { NextResponse } from "next/server";
import { USERS } from "../../users";

export async function GET() {
  return NextResponse.json(USERS);
}
