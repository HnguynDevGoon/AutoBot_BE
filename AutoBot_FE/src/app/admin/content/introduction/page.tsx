import ContentIntroduction from "@/components/admin/content/introduction/content";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang nội dung giới thiệu Admin - AutoBot Phái Sinh',
    description: 'Trang nội dung giới thiệu Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const ContentIntroductionPage = () =>{
    return(
        <div>
            <ContentIntroduction/>
        </div>
    )
}

export default ContentIntroductionPage;