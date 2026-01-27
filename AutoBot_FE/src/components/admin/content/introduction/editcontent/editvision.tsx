'use client';

import handleUpload from "@/components/shared/cloudinary/upload-image";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
    MdCloudUpload, MdDelete, MdOutlineClose,
    MdRefresh, MdSave, MdOutlineSmartphone,
    MdOutlineTabletMac,
    MdOutlineDesktopWindows
} from "react-icons/md";
import { toast } from "sonner";

interface VisionData {
    id?: string;
    title: string;
    description: string;
    icon: string;
    otherType: string;
}

interface EditVisionProps {
    isOpenModal: boolean;
    data: any;
    accessToken: string;
    setIsOpenModal: (val: boolean) => void;
    onRefresh?: () => void;
}

const EditVision = ({ isOpenModal, data, accessToken, setIsOpenModal, onRefresh }: EditVisionProps) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contentData, setContentData] = useState<VisionData>({
        title: '',
        description: '',
        icon: '',
        otherType: 'vision-introduction'
    });

    const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'pc'>('pc');
    useEffect(() => {
        const fetchDetail = async () => {
            const itemId = typeof data === 'string' ? data : data?.id;
            if (!isOpenModal || !itemId) return;
            setFetching(true);
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/GetOtherContentById?id=${itemId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                const result = response.data.data || response.data;

                setContentData({
                    id: result.id,
                    title: result.title || '',
                    description: result.description || '',
                    icon: result.icon || '',
                    otherType: result.otherType || 'vision-introduction'
                });
            } catch (error) {
                toast.error("Không thể lấy thông tin chi tiết!");
                setIsOpenModal(false);
            } finally {
                setFetching(false);
            }
        };

        fetchDetail();
    }, [isOpenModal, data, accessToken]);

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const secureUrl = await handleUpload(file);
            if (secureUrl) {
                setContentData(prev => ({ ...prev, icon: secureUrl }));
                toast.success("Thay đổi hình ảnh thành công!");
            }
        } catch (error) {
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateVision = async () => {
        if (!contentData.title.trim()) return toast.error("Vui lòng nhập tiêu đề");
        if (!contentData.icon.trim()) return toast.error("Vui lòng tải lên hình ảnh/icon");
        if (!contentData.description.trim()) return toast.error("Vui lòng nhập mô tả");

        setLoading(true);
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/UpdateOtherContent`, contentData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success("Cập nhật tầm nhìn thành công!");
            setIsOpenModal(false);
            if (onRefresh) onRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const config = viewMode === 'mobile'
        ? { width: 430, scale: 0.8 }
        : viewMode === 'tablet'
            ? { width: 820, scale: 0.7 }
            : { width: 1440, scale: 0.45 };

    return (
        <AnimatePresence>
            {isOpenModal && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsOpenModal(false)} />
                    <motion.div className="fixed inset-0 z-70 flex items-center justify-center p-4 pointer-events-none" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col pointer-events-auto border border-gray-100 relative">
                            {fetching && (
                                <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                                    <MdRefresh className="animate-spin text-blue-600" size={50} />
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Đang tải dữ liệu từ server...</p>
                                </div>
                            )}
                            <div className="flex justify-between items-center p-4 border-b bg-white shrink-0">
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter text-black">
                                        Cập nhật Tầm Nhìn
                                    </h2>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        ID: {contentData.id || "Loading..."}
                                    </span>
                                </div>
                                <button onClick={() => setIsOpenModal(false)} className="hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer text-gray-400"><MdOutlineClose size={26} /></button>
                            </div>
                            <div className="flex flex-1 overflow-hidden bg-gray-50">
                                <div className="w-[420px] p-8 space-y-6 border-r overflow-y-auto bg-white shrink-0 scrollbar-hide">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Tiêu đề</label>
                                            <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none font-bold focus:border-blue-500 transition-colors" value={contentData.title} onChange={(e) => setContentData({ ...contentData, title: e.target.value })} placeholder="VD: TẦM NHÌN CHIẾN LƯỢC" />
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Icon / Hình ảnh</label>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelect} />
                                            {!contentData.icon ? (
                                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-40 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                                                    {uploading ? <MdRefresh className="animate-spin text-blue-500" size={30} /> : <MdCloudUpload size={40} />}
                                                    <span className="text-[10px] font-black uppercase tracking-tight text-center px-6">Tải ảnh lên</span>
                                                </button>
                                            ) : (
                                                <div className="relative group w-full h-40 rounded-[2.5rem] overflow-hidden shadow-sm border-4 border-gray-50 bg-gray-50 p-4 flex items-center justify-center">
                                                    <img src={contentData.icon} className="w-full h-full object-contain" alt="Preview" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform cursor-pointer"><MdRefresh size={20} /></button>
                                                        <button onClick={() => setContentData({ ...contentData, icon: '' })} className="p-3 bg-white rounded-full text-red-600 hover:scale-110 transition-transform cursor-pointer"><MdDelete size={20} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Nội dung chi tiết</label>
                                            <textarea rows={6} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none resize-none font-medium text-gray-600 leading-relaxed focus:border-blue-500 transition-colors" value={contentData.description} onChange={(e) => setContentData({ ...contentData, description: e.target.value })} placeholder="Mô tả chi tiết..." />
                                        </div>
                                    </div>
                                    <div className="pt-6 space-y-3">
                                        <button
                                            onClick={handleUpdateVision}
                                            disabled={loading || uploading || fetching}
                                            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-600 active:scale-[0.98] transition-all text-xs uppercase flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none cursor-pointer"
                                        >
                                            {loading ? <MdRefresh className="animate-spin" size={20} /> : <MdSave size={20} />}
                                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                                        </button>
                                        <button onClick={() => setIsOpenModal(false)} className="w-full py-4 bg-gray-500 text-white rounded-2xl font-bold hover:bg-gray-600 active:scale-95 transition-all text-xs uppercase flex items-center justify-center gap-2 cursor-pointer">
                                            Hủy bỏ
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-100 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex bg-white p-1 rounded-2xl shadow-xl border border-gray-100">
                                        {(['pc', 'tablet', 'mobile'] as const).map((mode) => (
                                            <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer ${viewMode === mode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                                                {mode === 'pc' && <MdOutlineDesktopWindows size={16} />}
                                                {mode === 'tablet' && <MdOutlineTabletMac size={16} />}
                                                {mode === 'mobile' && <MdOutlineSmartphone size={16} />}
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 pt-32">
                                        <div
                                            className="relative flex justify-center origin-top transition-all duration-500 ease-in-out"
                                            style={{
                                                width: viewMode === 'pc' ? '180%' : '100%',
                                                transform: `scale(${config.scale})`,
                                            }}
                                        >
                                            <div
                                                style={{ width: config.width }}
                                                className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[4rem] border-14 border-slate-900 h-fit min-h-[800px] overflow-hidden shrink-0"
                                            >
                                                <div className="pt-24 pb-20 text-center">
                                                    <h1 className="text-8xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                                                        Preview <span className="text-blue-600">Update</span>
                                                    </h1>
                                                </div>

                                                <div className="px-14 pb-32">
                                                    <div className="flex justify-center items-center h-full">
                                                        <div className="w-full max-w-[450px]">
                                                            <VisionCardItem data={contentData} isDraft={true} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                                        <div className="bg-slate-900/90 px-8 py-5 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-6">
                                            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                                            <span className="text-white text-xs font-black uppercase tracking-widest">Chế độ chỉnh sửa trực tiếp (Live Editing)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const VisionCardItem = ({ data, isDraft = false }: { data: VisionData, isDraft?: boolean }) => {
    return (
        <div className={`bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border-2 transition-all duration-500 flex flex-col items-center text-center p-14 h-full 
            ${isDraft ? 'border-blue-600 ring-12 ring-blue-600/5 scale-105' : 'border-gray-50 opacity-90'}`}>
            <div className="w-36 h-36 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-10 overflow-hidden shadow-sm p-4">
                {data.icon ? (
                    <img src={data.icon} className="w-full h-full object-contain" alt="icon" />
                ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse" />
                )}
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-5 leading-tight line-clamp-2">
                {data.title || "TIÊU ĐỀ TẦM NHÌN"}
            </h3>
            <p className="text-gray-400 text-base font-bold leading-relaxed line-clamp-4 italic">
                {data.description || "Mô tả về tầm nhìn doanh nghiệp..."}
            </p>
        </div>
    );
};

export default EditVision;