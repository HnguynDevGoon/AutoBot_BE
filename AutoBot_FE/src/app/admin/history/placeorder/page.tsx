import HistoryPlaceOrder from "@/components/admin/history/placeorder/placeorder";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang lịch sử đặt lệnh Admin - AutoBot Phái Sinh',
    description: 'Trang lịch sử đặt lệnh Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const HistoryPlaceOrderPage = () => {
    return (
        <div>
            <HistoryPlaceOrder />
        </div>
    )
}

export default HistoryPlaceOrderPage;