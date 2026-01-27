import ContentHome from "@/components/admin/content/home/content";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang nội dung trang chủ Admin - AutoBot Phái Sinh',
    description: 'Trang nội dung trang chủ Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const ContentHomePage = () =>{
    return(
        <div>
            <ContentHome/>
        </div>
    )
}

export default ContentHomePage;