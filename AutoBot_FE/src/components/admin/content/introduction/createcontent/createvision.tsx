'use client';

import handleUpload from "@/components/shared/cloudinary/upload-image";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import {
    MdCloudUpload, MdDelete, MdOutlineClose,
    MdRefresh, MdSave, MdOutlineSmartphone,
    MdOutlineTabletMac,
    MdOutlineDesktopWindows
} from "react-icons/md";
import { toast } from "sonner";

const CreateVision = ({ isOpenModal, existingData, accessToken, setIsOpenModal, onRefresh }: {
    isOpenModal: boolean,
    existingData: any,
    accessToken: string,
    setIsOpenModal: (val: boolean) => void,
    onRefresh?: () => void
}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'pc'>('pc');
    const [contentData, setContentData] = useState({
        title: '',
        description: '',
        icon: '',
        otherType: 'vision-introduction'
    });

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const secureUrl = await handleUpload(file);
            if (secureUrl) {
                setContentData(prev => ({ ...prev, icon: secureUrl }));
                toast.success("Tải hình ảnh thành công!");
            }
        } catch (error) {
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateVision = async () => {
        const visionCount = existingData?.filter((item: any) => item.otherType === 'vision-introduction').length || 0;
        if (visionCount >= 4) {
            toast.error("Chỉ cho phép tối đa 4 nội dung tầm nhìn!");
            return;
        }
        if (!contentData.title.trim()) return toast.error("Vui lòng nhập tiêu đề");
        if (!contentData.icon.trim()) return toast.error("Vui lòng tải lên hình ảnh/icon");
        if (!contentData.description.trim()) return toast.error("Vui lòng nhập mô tả");
        setLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/CreateOtherContent`, contentData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            toast.success("Thêm tầm nhìn thành công!");
            setContentData({ title: '', description: '', icon: '', otherType: 'vision-introduction' });
            setIsOpenModal(false);
            if (onRefresh) onRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi lưu dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const config = viewMode === 'mobile'
        ? { width: 430, scale: 0.8, columns: 'grid-cols-1' }
        : viewMode === 'tablet'
            ? { width: 820, scale: 0.7, columns: 'grid-cols-2' }
            : { width: 1440, scale: 0.4, columns: 'grid-cols-4' };

    return (
        <AnimatePresence>
            {isOpenModal && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsOpenModal(false)} />
                    <motion.div className="fixed inset-0 z-70 flex items-center justify-center p-4 pointer-events-none" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col pointer-events-auto border border-gray-100">
                            <div className="flex justify-between items-center p-4 border-b bg-white shrink-0">
                                <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter text-slate-800">
                                    Thêm Mục tiêu & Tầm Nhìn ({existingData?.filter((i: any) => i.otherType === 'vision-introduction').length}/4)
                                </h2>
                                <button onClick={() => {
                                    setIsOpenModal(false);
                                    setContentData({ title: '', description: '', icon: '', otherType: 'vision-introduction' });
                                }} className="hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer text-gray-400"><MdOutlineClose size={26} /></button>
                            </div>
                            <div className="flex flex-1 overflow-hidden bg-gray-50">
                                <div className="w-[420px] p-8 space-y-6 border-r overflow-y-auto bg-white shrink-0 scrollbar-hide">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[11px] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Tiêu đề tầm nhìn</label>
                                            <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none font-bold focus:border-blue-500 transition-colors" value={contentData.title} onChange={(e) => setContentData({ ...contentData, title: e.target.value })} placeholder="VD: TẦM NHÌN CHIẾN LƯỢC" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Hình ảnh minh họa</label>
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
                                                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"><MdRefresh size={20} /></button>
                                                        <button onClick={() => setContentData({ ...contentData, icon: '' })} className="p-3 bg-white rounded-full text-red-600 hover:scale-110 transition-transform"><MdDelete size={20} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Nội dung chi tiết</label>
                                            <textarea rows={6} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none resize-none font-medium text-gray-600 leading-relaxed focus:border-blue-500 transition-colors" value={contentData.description} onChange={(e) => setContentData({ ...contentData, description: e.target.value })} placeholder="Mô tả chi tiết về tầm nhìn này..." />
                                        </div>
                                    </div>

                                    <div className="pt-6 space-y-3">
                                        <button
                                            onClick={handleCreateVision}
                                            disabled={loading || uploading || (existingData?.filter((i: any) => i.otherType === 'vision-introduction').length >= 4)}
                                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all text-xs uppercase flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none cursor-pointer"
                                        >
                                            {loading ? <MdRefresh className="animate-spin" size={20} /> : <MdSave size={20} />}
                                            {loading ? "Đang lưu..." : "Lưu tầm nhìn"}
                                        </button>
                                        <button onClick={() => {
                                            setIsOpenModal(false);
                                            setContentData({ title: '', description: '', icon: '', otherType: 'vision-introduction' });
                                        }} className="w-full py-4 bg-gray-500 text-white rounded-2xl font-bold hover:bg-gray-600 active:scale-95 transition-all text-xs uppercase flex items-center justify-center gap-2 cursor-pointer">
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
                                    <div className="flex-1 overflow-y-auto scrollbar-hide p-8 pt-32 pb-44">
                                        <div className="flex flex-col items-center justify-start min-h-full">
                                            <div
                                                className="relative flex justify-center origin-top transition-all duration-500 ease-in-out"
                                                style={{
                                                    width: viewMode === 'pc' ? '180%' : '100%',
                                                    transform: `scale(${config.scale})`,
                                                    transformOrigin: 'top center'
                                                }}
                                            >
                                                <div
                                                    style={{ width: config.width }}
                                                    className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[4rem] border-14 border-slate-900 h-fit min-h-[900px] overflow-hidden shrink-0"
                                                >
                                                    <div className="pt-24 pb-20 text-center">
                                                        <h1 className="text-8xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                                                            GOALS <span className="text-blue-600">&</span> VISION
                                                        </h1>
                                                    </div>

                                                    <div className="px-14 pb-32">
                                                        <div className={`grid ${config.columns} gap-12`}>
                                                            {existingData?.filter((i: any) => i.otherType === 'vision-introduction').length < 4 && (
                                                                <VisionCardItem data={contentData} isDraft={true} />
                                                            )}
                                                            {existingData?.filter((i: any) => i.otherType === 'vision-introduction').map((item: any, idx: number) => (
                                                                <VisionCardItem key={idx} data={item} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="flex items-center gap-8 bg-slate-900/90 px-8 py-5 rounded-4xl backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Device Mode</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-blue-400">
                                                        {viewMode === 'pc' && <MdOutlineDesktopWindows size={14} />}
                                                        {viewMode === 'tablet' && <MdOutlineTabletMac size={14} />}
                                                        {viewMode === 'mobile' && <MdOutlineSmartphone size={14} />}
                                                    </span>
                                                    <span className="text-sm font-black text-white uppercase tracking-tight">{viewMode}</span>
                                                </div>
                                            </div>
                                            <div className="w-px h-10 bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Scale</span>
                                                <span className="text-sm font-black text-blue-400">{(config.scale * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="w-px h-10 bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Resolution</span>
                                                <span className="text-sm font-black text-white tracking-tight">{config.width}px</span>
                                            </div>
                                        </motion.div>
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

const VisionCardItem = ({ data, isDraft = false }: any) => {
    return (
        <div className={`bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border-2 transition-all duration-500 flex flex-col items-center text-center p-14 h-full ${isDraft ? 'border-blue-600 ring-12 ring-blue-600/5 scale-105' : 'border-gray-50 opacity-90'}`}>
            <div className="w-36 h-36 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-10 overflow-hidden">
                {data.icon ? (
                    <img src={data.icon} className="w-full h-full object-cover" alt="vision" />
                ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse" />
                )}
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-5 leading-tight line-clamp-2">
                {data.title || "TIÊU ĐỀ TẦM NHÌN"}
            </h3>
            <p className="text-gray-400 text-base font-bold leading-relaxed line-clamp-4 italic">
                {data.description || "Mô tả về tầm nhìn doanh nghiệp sẽ hiển thị tại đây khi bạn nhập nội dung..."}
            </p>
        </div>
    );
};

export default CreateVision;