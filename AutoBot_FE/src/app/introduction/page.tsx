import Introduction from "@/components/client/introduction/introduction";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = {
    title: 'Trang giới thiệu - AutoBot Phái Sinh',
    description: 'Trang giới thiệu AutoBot - Cho thuê bot chứng khoán phái sinh'
}


const IntroductionPage = () =>{
    return(
        <div>
            <Introduction/>
        </div>
    )
}

export default IntroductionPage;