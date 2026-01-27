import UserManagement from "@/components/admin/user/management/usermanagement";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang người dùng Admin - AutoBot Phái Sinh',
    description: 'Trang người dùng Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const UserManagementPage = () => {
    return (
        <div>
            <UserManagement />
        </div>
    )
}

export default UserManagementPage;