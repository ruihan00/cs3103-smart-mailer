import { NextResponse } from "next/server";
import ClickService from "@/lib/database/clickService";
import { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  try {
    // Extract mailerId from URL parameters
    const { searchParams } = new URL(request.url);
    const mailerId = searchParams.get("mailerId");

    if (!mailerId) {
      return NextResponse.json(
        { error: "Missing mailerId parameter" },
        { status: 400 }
      );
    }

    const clickService = ClickService.getInstance();
    const clickCount = await clickService.getClicks(mailerId);

    return NextResponse.json({ clickCount }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
