import Purchase from "@/components/client/purchase/purchase";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang lịch sử giao dịch - AutoBot Phái Sinh',
    description: 'Trang lịch sử giao dịch AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const PurchasePage = async() =>{
    return(
        <div>
            <Purchase/>
        </div>
    )
}

export default PurchasePage;