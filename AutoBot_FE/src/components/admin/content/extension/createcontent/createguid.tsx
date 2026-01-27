'use client';

import handleUpload from "@/components/shared/cloudinary/upload-image";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import {
    MdCloudUpload, MdDelete, MdOutlineClose,
    MdRefresh, MdSave, MdOutlineSmartphone,
    MdOutlineTabletMac,
    MdOutlineDesktopWindows,
    MdAutoAwesome
} from "react-icons/md";
import { toast } from "sonner";

const CreateGuid = ({ isOpenModal, existingData, accessToken, setIsOpenModal, onRefresh }: {
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
        otherType: 'guid-extension'
    });

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const secureUrl = await handleUpload(file);
            if (secureUrl) {
                setContentData(prev => ({ ...prev, icon: secureUrl }));
                toast.success("Tải icon hướng dẫn thành công!");
            }
        } catch (error) {
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateGuid = async () => {
        if (!contentData.title.trim()) return toast.error("Vui lòng nhập tiêu đề hướng dẫn");
        if (!contentData.icon.trim()) return toast.error("Vui lòng tải lên icon");
        if (!contentData.description.trim()) return toast.error("Vui lòng nhập mô tả chi tiết");
        setLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/CreateOtherContent`, contentData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            toast.success("Thêm hướng dẫn mở rộng thành công!");
            setContentData({ title: '', description: '', icon: '', otherType: 'guid-extension' });
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
                    <motion.div className="fixed inset-0 bg-slate-900/60 z-60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsOpenModal(false)} />
                    <motion.div className="fixed inset-0 z-70 flex items-center justify-center p-4 pointer-events-none" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col pointer-events-auto border border-gray-100">
                            <div className="flex justify-between items-center p-4 border-b bg-white shrink-0">
                                <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter text-black">
                                    Hướng dẫn hệ thống ({existingData?.filter((i: any) => i.otherType === 'guid-extension').length}/4)
                                </h2>
                                <button onClick={() => {
                                    setIsOpenModal(false);
                                    setContentData({ title: '', description: '', icon: '', otherType: 'guid-extension' });
                                }} className="hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer text-gray-400"><MdOutlineClose size={26} /></button>
                            </div>
                            <div className="flex flex-1 overflow-hidden bg-gray-50">
                                <div className="w-[420px] p-8 space-y-6 border-r overflow-y-auto bg-white shrink-0 scrollbar-hide">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Tiêu đề hướng dẫn</label>
                                            <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none font-bold focus:border-indigo-500 transition-colors" value={contentData.title} onChange={(e) => setContentData({ ...contentData, title: e.target.value })} placeholder="VD: HƯỚNG DẪN CÀI EXTENSION" />
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Icon nhận diện</label>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelect} />
                                            {!contentData.icon ? (
                                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-40 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">
                                                    {uploading ? <MdRefresh className="animate-spin text-blue-500" size={30} /> : <MdCloudUpload size={40} />}
                                                    <span className="text-[10px] font-black uppercase tracking-tight text-center px-6">Tải lên icon hướng dẫn</span>
                                                </button>
                                            ) : (
                                                <div className="relative group w-full h-40 rounded-[2.5rem] overflow-hidden shadow-sm border-4 border-gray-50 bg-indigo-50/30 p-4 flex items-center justify-center">
                                                    <img src={contentData.icon} className="w-full h-full object-contain" alt="Preview" />
                                                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform"><MdRefresh size={20} /></button>
                                                        <button onClick={() => setContentData({ ...contentData, icon: '' })} className="p-3 bg-white rounded-full text-red-600 hover:scale-110 transition-transform"><MdDelete size={20} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Nội dung chi tiết</label>
                                            <textarea rows={6} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none resize-none font-medium text-gray-600 leading-relaxed focus:border-indigo-500 transition-colors" value={contentData.description} onChange={(e) => setContentData({ ...contentData, description: e.target.value })} placeholder="Mô tả các bước thực hiện..." />
                                        </div>
                                    </div>
                                    <div className="pt-6 space-y-3">
                                        <button
                                            onClick={handleCreateGuid}
                                            disabled={loading || uploading || (existingData?.filter((i: any) => i.otherType === 'guid-extension').length >= 4)}
                                            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-blue-600 active:scale-[0.98] transition-all text-xs uppercase flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none cursor-pointer"
                                        >
                                            {loading ? <MdRefresh className="animate-spin" size={20} /> : <MdSave size={20} />}
                                            {loading ? "Đang xử lý..." : "Lưu hướng dẫn"}
                                        </button>
                                        <button onClick={() => {
                                            setIsOpenModal(false);
                                            setContentData({ title: '', description: '', icon: '', otherType: 'guid-extension' });
                                        }} className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-xs uppercase cursor-pointer">
                                            Hủy bỏ
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-200 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex bg-white/80 backdrop-blur p-1 rounded-2xl shadow-xl border border-white/20">
                                        {(['pc', 'tablet', 'mobile'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setViewMode(mode)}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer ${viewMode === mode ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-white'}`}
                                            >
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
                                                    className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[4rem] border-14 border-slate-900 h-fit min-h-[900px] overflow-hidden shrink-0 transition-all duration-500"
                                                >
                                                    <div className={`text-center transition-all ${viewMode === 'mobile' ? 'pt-16 pb-12' : 'pt-24 pb-20'}`}>
                                                        <h1 className={`font-black italic uppercase tracking-tighter text-slate-900 leading-none transition-all ${viewMode === 'mobile' ? 'text-5xl' : 'text-8xl'}`}>
                                                            System <span className="text-indigo-600">Guideline</span>
                                                        </h1>
                                                    </div>
                                                    <div className="px-14 pb-32">
                                                        <div className={`grid ${config.columns} gap-8`}>
                                                            {existingData?.filter((i: any) => i.otherType === 'guid-extension').length < 4 && (
                                                                <GuidCardItem data={contentData} isDraft={true} viewMode={viewMode} />
                                                            )}
                                                            {existingData?.filter((i: any) => i.otherType === 'guid-extension')
                                                                .map((item: any, idx: number) => (
                                                                    <GuidCardItem key={idx} data={item} isDraft={false} viewMode={viewMode} />
                                                                ))
                                                            }
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

const GuidCardItem = ({ data, isDraft = false, viewMode }: any) => {
    return (
        <div className={`w-full rounded-[3.5rem] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group transition-all duration-500 h-full ${isDraft
            ? 'bg-slate-900 scale-105 ring-4 ring-indigo-500 z-10'
            : 'bg-slate-800 opacity-90'
            }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-600/40 transition-colors"></div>
            <div className="w-24 h-24 bg-white rounded-4xl flex items-center justify-center mb-8 shadow-xl p-5 relative z-10 transition-transform group-hover:scale-110">
                {data.icon ? (
                    <img src={data.icon} className="w-full h-full object-contain" alt="guid-icon" />
                ) : (
                    <MdAutoAwesome className="text-indigo-600" size={40} />
                )}
            </div>
            <h3 className={`font-black text-white uppercase tracking-tight mb-4 leading-tight relative z-10 ${viewMode === 'mobile' ? 'text-xl' : 'text-2xl'}`}>
                {data.title || "TÊN HƯỚNG DẪN"}
            </h3>
            <p className={`text-slate-400 font-medium leading-relaxed relative z-10 line-clamp-4 ${viewMode === 'mobile' ? 'text-xs' : 'text-sm'}`}>
                {data.description || "Mô tả các bước thực hiện quy trình này..."}
            </p>
            <div className="w-10 h-1 bg-indigo-600 rounded-full mt-auto pt-0 relative z-10 opacity-60"></div>
        </div>
    );
};

export default CreateGuid;