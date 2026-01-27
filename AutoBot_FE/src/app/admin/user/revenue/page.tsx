import UserRevenue from "@/components/admin/user/revenue/userrevenue";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang người dùng Bot Admin - AutoBot Phái Sinh',
    description: 'Trang người dùng Bot Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const UserRevenuePage = () => {
    return (
        <div>
            <UserRevenue />
        </div>
    )
}

export default UserRevenuePage;