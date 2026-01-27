import ManagementRole from "@/components/admin/management/role/role";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang quản lý quyền Admin - AutoBot Phái Sinh',
    description: 'Trang quản lý quyền Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const ManagementRolePage = () => {
    return (
        <div>
            <ManagementRole />
        </div>
    )
}

export default ManagementRolePage;