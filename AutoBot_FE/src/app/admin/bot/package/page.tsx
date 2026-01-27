import Package from "@/components/admin/bot/package/package";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang gói Bot Admin - AutoBot Phái Sinh',
    description: 'Trang gói Bot Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const PackagePage = async() =>{
    return(
        <div>
            <Package/>
        </div>
    )
}

export default PackagePage;