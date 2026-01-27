import PlaceOrder from "@/components/admin/placeorder/placeorder";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang đặt lệnh Bot - AutoBot Phái Sinh',
    description: 'Trang đặt lệnh Bot AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const PlaceOrderPage = () => {
    return (
        <div>
            <PlaceOrder />
        </div>
    )
}

export default PlaceOrderPage;