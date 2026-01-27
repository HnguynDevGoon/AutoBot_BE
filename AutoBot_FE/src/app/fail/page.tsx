import Fail from "@/components/client/layouts/failed";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = {
    title: 'Trang trạng thái - AutoBot Phái Sinh',
    description: 'Trang trạng thái AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const FailPage = () => {
    return (
        <div>
            <Fail />
        </div>
    )
}

export default FailPage;