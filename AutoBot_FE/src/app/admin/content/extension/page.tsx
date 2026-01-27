import ContentExtension from "@/components/admin/content/extension/content";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang nội dung tiện ích Admin - AutoBot Phái Sinh',
    description: 'Trang nội dung tiện ích Admin AutoBot - Cho thuê bot chứng khoán phái sinh'
}

const ContentExtensionPage = () =>{
    return(
        <div>
            <ContentExtension/>
        </div>
    )
}

export default ContentExtensionPage;