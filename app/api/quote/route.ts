import { NextRequest, NextResponse } from "next/server";
import { yahooFinance } from "@/lib/yfinance";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (!name) {
        return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const result = await yahooFinance.quote(name);

    return NextResponse.json(result);
}