import ManagementExpense from "@/components/admin/management/expense/expense";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang quản lý chi tiêu Admin - AutoBot Phái Sinh',
    description: 'Trang quản lý chi tiêu Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const ManagementExpensePage = () => {
    return (
        <div>
            <ManagementExpense />
        </div>
    )
}

export default ManagementExpensePage;