import Bot from "@/components/admin/bot/management/bot";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang quản lý Bot - AutoBot Phái Sinh',
    description: 'Trang quản lý Bot AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const ManagementPage = () => {
    return (
        <div>
            <Bot />
        </div>
    )
}

export default ManagementPage;