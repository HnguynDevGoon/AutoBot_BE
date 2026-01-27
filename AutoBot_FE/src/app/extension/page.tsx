import Extension from "@/components/client/extension/extension";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = {
    title: 'Trang tải Extension - AutoBot Phái Sinh',
    description: 'Trang tải Extension AutoBot - Cho thuê bot chứng khoán phái sinh'
}


const ExtensionPage = () => {
    return (
        <div>
            <Extension/>
        </div>
    )
}

export default ExtensionPage;