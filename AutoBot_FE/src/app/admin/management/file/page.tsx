import ManagementFile from "@/components/admin/management/file/file";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang quản lý file script Admin - AutoBot Phái Sinh',
    description: 'Trang quản lý file script Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const ManagementFilePage = () => {
    return (
        <div>
            <ManagementFile />
        </div>
    )
}

export default ManagementFilePage;