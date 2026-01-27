import ManagementSalary from "@/components/admin/management/salary/salary";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang quản lý lương nhân viên Admin - AutoBot Phái Sinh',
    description: 'Trang quản lý lương nhân viên Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const ManagementSalaryPage = () => {
    return (
        <div>
            <ManagementSalary />
        </div>
    )
}

export default ManagementSalaryPage;