import UserBot from "@/components/admin/user/userbot/userbot";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang lợi nhuận người dùng Admin - AutoBot Phái Sinh',
    description: 'Trang lợi nhuận người dùng Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const UserBotPage = () => {
    return (
        <div>
            <UserBot />
        </div>
    )
}

export default UserBotPage;