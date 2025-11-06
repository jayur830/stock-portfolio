import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Stock } from "@/types";
import { memo } from "react";

const StockCard = ({ stock }: { stock: Stock }) => {
    return (
        <Card className="p-4">
            <CardHeader>
                <Input type="search" placeholder="종목검색" className="flex-1" value={stock.ticker} />
                <Input type="text" placeholder="종목명" value={stock.name} />
            </CardHeader>
            <CardContent className="flex gap-2">
                <Input type="number" placeholder="가격" value={stock.price} />
                <Input type="number" placeholder="배당" value={stock.dividend} />
                <Input type="number" placeholder="배당률" value={stock.yield} />
                <Input type="number" placeholder="수량" value={stock.amount} />
            </CardContent>
        </Card>
    );
}

export default memo(StockCard);
