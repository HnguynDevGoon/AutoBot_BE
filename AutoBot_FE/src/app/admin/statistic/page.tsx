import Statistic from "@/components/admin/statistic/statistic";
import UserManagementPage from "@/components/admin/user/management/usermanagement";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang thống kê Admin - AutoBot Phái Sinh',
    description: 'Trang thống kê Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const StatisticPage = () => {
    return (
        <div>
            <Statistic />
        </div>
    )
}

export default StatisticPage;