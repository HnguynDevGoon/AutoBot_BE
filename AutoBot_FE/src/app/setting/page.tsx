import Setting from "@/components/client/setting/setting";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang cài đặt - AutoBot Phái Sinh',
    description: 'Trang cài đặt AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const SettingPage = async() =>{
    return(
        <div>
            <Setting/>
        </div>
    )
}

export default SettingPage;