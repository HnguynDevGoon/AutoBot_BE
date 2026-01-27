import Information from "@/components/client/information/information";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = {
    title: 'Trang thông tin cá nhân - AutoBot Phái Sinh',
    description: 'Trang thông tin cá nhân AutoBot - Cho thuê bot chứng khoán phái sinh'
}


const InformationPgae = () =>{
    return(
        <div>
            <Information/>
        </div>
    )
}

export default InformationPgae;