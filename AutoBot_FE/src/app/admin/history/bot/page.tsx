
import HistoryBot from "@/components/admin/history/bot/bot";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang lịch sử mua Bot - AutoBot Phái Sinh',
    description: 'Trang lịch sử mua Bot AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const HistoryBotPage = () => {
    return (
        <div>
            <HistoryBot />
        </div>
    )
}

export default HistoryBotPage;