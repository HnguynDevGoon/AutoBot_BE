import HistoryTransaction from "@/components/admin/history/transaction/transaction";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang lịch sử giao dịch Admin - AutoBot Phái Sinh',
    description: 'Trang lịch sử giao dịch Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const HistoryTransactionPage = () => {
    return (
        <div>
            <HistoryTransaction />
        </div>
    )
}

export default HistoryTransactionPage;