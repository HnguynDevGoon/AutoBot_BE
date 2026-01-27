import MemberShip from "@/components/client/membership/membership";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang hạng thành viên - AutoBot Phái Sinh',
    description: 'Trang hạng thành viên AutoBot - Cho thuê bot chứng khoán phái sinh'
}


const MemberShipPage = () => {
    return (
        <div>
            <MemberShip/>
        </div>
    )
}

export default MemberShipPage;