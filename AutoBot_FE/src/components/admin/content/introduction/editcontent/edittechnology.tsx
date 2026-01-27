'use client';

import handleUpload from "@/components/shared/cloudinary/upload-image";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
    MdCloudUpload, MdDelete, MdOutlineClose,
    MdRefresh, MdSave, MdOutlineSmartphone,
    MdOutlineTabletMac,
    MdOutlineDesktopWindows,
    MdMemory
} from "react-icons/md";
import { toast } from "sonner";

interface EditTechnologyProps {
    isOpenModal: boolean;
    setIsOpenModal: (val: boolean) => void;
    data: any;
    accessToken: string;
    onRefresh: () => void;
}

const EditTechnology = ({ isOpenModal, setIsOpenModal, data, accessToken, onRefresh }: EditTechnologyProps) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'pc'>('pc');
    const [contentData, setContentData] = useState({
        id: '',
        title: '',
        description: '',
        icon: '',
        otherType: 'technology-introduction'
    });

    useEffect(() => {
        const fetchDetail = async () => {
            if (!isOpenModal || !data) return;
            setFetching(true);
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_URL_API}OtherContent/GetOtherContentById?id=${data}`,
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                );
                const result = response.data.data || response.data;
                setContentData({
                    id: result.id,
                    title: result.title || '',
                    description: result.description || '',
                    icon: result.icon || '',
                    otherType: result.otherType || 'technology-introduction'
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
                toast.success("Thay đổi icon thành công!");
            }
        } catch (error) {
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async () => {
        if (!contentData.title.trim() || !contentData.icon.trim() || !contentData.description.trim()) {
            return toast.error("Vui lòng điền đầy đủ thông tin");
        }

        setLoading(true);
        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_URL_API}OtherContent/UpdateOtherContent`,
                contentData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            toast.success("Cập nhật công nghệ thành công!");
            setIsOpenModal(false);
            onRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
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
                    <motion.div className="fixed inset-0 bg-slate-900/60 z-60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsOpenModal(false)} />
                    <motion.div className="fixed inset-0 z-70 flex items-center justify-center p-4 pointer-events-none" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col pointer-events-auto border border-gray-100 relative">
                            {fetching && (
                                <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center">
                                    <MdRefresh className="animate-spin text-indigo-600 mb-2" size={40} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Đang đồng bộ dữ liệu...</p>
                                </div>
                            )}
                            <div className="flex justify-between items-center p-4 border-b bg-white shrink-0">
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter text-black">
                                        Chỉnh sửa công nghệ
                                    </h2>
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">ID: {contentData.id || '...'}</span>
                                </div>
                                <button onClick={() => setIsOpenModal(false)} className="hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer text-gray-400"><MdOutlineClose size={26} /></button>
                            </div>

                            <div className="flex flex-1 overflow-hidden bg-gray-50">
                                <div className="w-[420px] p-8 space-y-6 border-r overflow-y-auto bg-white shrink-0 scrollbar-hide">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Tên công nghệ</label>
                                            <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none font-bold focus:border-indigo-500 transition-colors" value={contentData.title} onChange={(e) => setContentData({ ...contentData, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Icon (Cloudinary)</label>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelect} />
                                            {contentData.icon ? (
                                                <div className="relative group w-full h-40 rounded-4xl overflow-hidden border-4 border-gray-50 bg-indigo-50/30 p-4 flex items-center justify-center">
                                                    <img src={contentData.icon} className="w-full h-full object-contain" alt="Preview" />
                                                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform cursor-pointer"><MdRefresh size={20} /></button>
                                                        <button onClick={() => setContentData({ ...contentData, icon: '' })} className="p-3 bg-white rounded-full text-red-600 hover:scale-110 transition-transform cursor-pointer"><MdDelete size={20} /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-40 border-2 border-dashed border-gray-200 rounded-4xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">
                                                    {uploading ? <MdRefresh className="animate-spin text-indigo-500" size={30} /> : <MdCloudUpload size={40} />}
                                                    <span className="text-[10px] font-black uppercase">Tải icon mới</span>
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Mô tả kỹ thuật</label>
                                            <textarea rows={6} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none resize-none font-medium text-gray-600 leading-relaxed focus:border-indigo-500 transition-colors" value={contentData.description} onChange={(e) => setContentData({ ...contentData, description: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="pt-6 space-y-3">
                                        <button
                                            onClick={handleUpdate}
                                            disabled={loading || uploading || fetching}
                                            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-blue-600 active:scale-[0.98] transition-all text-xs uppercase flex items-center justify-center gap-2 disabled:bg-gray-300 cursor-pointer"
                                        >
                                            {loading ? <MdRefresh className="animate-spin" size={20} /> : <MdSave size={20} />}
                                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                                        </button>
                                        <button onClick={() => setIsOpenModal(false)} className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-xs uppercase cursor-pointer">Hủy bỏ</button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-200 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex bg-white/80 backdrop-blur p-1 rounded-2xl shadow-xl border border-white/20">
                                        {(['pc', 'tablet', 'mobile'] as const).map((mode) => (
                                            <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer ${viewMode === mode ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-white'}`}>
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
                                                className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[4rem] border-14 border-slate-900 h-fit min-h-[800px] overflow-hidden shrink-0 transition-all duration-500"
                                            >
                                                {/* 1. Header Preview - Chỉnh size chữ linh hoạt cho Mobile */}
                                                <div className={`text-center transition-all ${viewMode === 'mobile' ? 'pt-16 pb-12' : 'pt-24 pb-20'}`}>
                                                    <h1 className={`font-black italic uppercase tracking-tighter text-slate-900 leading-none transition-all ${viewMode === 'mobile' ? 'text-5xl' : 'text-8xl'
                                                        }`}>
                                                        Preview <span className="text-blue-600">Update</span>
                                                    </h1>
                                                </div>
                                                <div className={`px-14 pb-32 flex justify-center items-center`}>
                                                    <div className="w-full max-w-[450px]">
                                                        <div className="w-full rounded-[3.5rem] bg-slate-900 p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/40 transition-colors"></div>
                                                            <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center mb-10 shadow-xl p-5 relative z-10">
                                                                {contentData.icon ? (
                                                                    <img
                                                                        src={contentData.icon}
                                                                        className="w-full h-full object-contain"
                                                                        alt="tech-icon"
                                                                    />
                                                                ) : (
                                                                    <MdMemory className="text-blue-600" size={48} />
                                                                )}
                                                            </div>
                                                            <h3 className={`font-black text-white uppercase tracking-tight mb-6 leading-tight relative z-10 transition-all ${viewMode === 'mobile' ? 'text-2xl' : 'text-4xl'
                                                                }`}>
                                                                {contentData.title || "TÊN CÔNG NGHỆ"}
                                                            </h3>
                                                            <p className={`text-slate-400 font-medium leading-relaxed relative z-10 transition-all ${viewMode === 'mobile' ? 'text-base' : 'text-xl'
                                                                }`}>
                                                                {contentData.description || "Mô tả kỹ thuật sẽ được hiển thị tại đây..."}
                                                            </p>
                                                            <div className="w-12 h-1.5 bg-blue-600 rounded-full mt-8 opacity-50"></div>
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

export default EditTechnology;