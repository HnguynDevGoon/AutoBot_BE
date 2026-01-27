'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { MdOutlineClose, MdOutlineSmartphone, MdOutlineTabletMac, MdOutlineDesktopWindows, MdSave, MdRefresh, MdCloudUpload, MdDelete } from "react-icons/md";
import { toast } from "sonner";
import axios from "axios";
import handleUpload from "@/components/shared/cloudinary/upload-image";
import Image from "next/image";

interface EditNewProps {
    isOpenModal: boolean;
    data: any;
    accessToken: string;
    setIsOpenModal: (val: boolean) => void;
    onRefresh?: () => void;
}

const EditNew = ({ isOpenModal, data, accessToken, setIsOpenModal, onRefresh }: EditNewProps) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'pc'>('pc');
    const [contentData, setContentData] = useState({
        id: '',
        title: '',
        urlAvatar: '',
        link: '',
        description: ''
    });

    const fetchContentDetail = async (id: string) => {
        setFetching(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Content/GetContentById?id=${id}`);
            if (res.data && res.data.data) {
                const item = res.data.data;
                setContentData({
                    id: item.id || '',
                    title: item.title || '',
                    urlAvatar: item.urlAvatar || '',
                    link: item.link || '',
                    description: item.description || ''
                });
            }
        } catch (error) {
            toast.error("Không thể tải thông tin chi tiết bài viết");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (isOpenModal && data) {
            const contentId = typeof data === 'string' ? data : data.id;
            if (contentId) {
                fetchContentDetail(contentId);
            }
        }
    }, [data, isOpenModal]);

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const secureUrl = await handleUpload(file);
            if (secureUrl) {
                setContentData(prev => ({ ...prev, urlAvatar: secureUrl }));
                toast.success("Đã cập nhật ảnh mới!");
            }
        } catch (error) {
            toast.error("Lỗi khi tải ảnh");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateContent = async () => {
        if (!contentData.title.trim()) return toast.error("Thiếu tiêu đề");
        if (!contentData.urlAvatar.trim()) return toast.error("Thiếu ảnh đại diện");
        setLoading(true);
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_URL_API}Content/UpdateContent`, contentData, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            toast.success("Cập nhật tin tức thành công!");
            setIsOpenModal(false);
            if (onRefresh) onRefresh();
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
        : { width: 1440, scale: 0.5 };

    return (
        <AnimatePresence>
            {isOpenModal && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsOpenModal(false)} />
                    <motion.div className="fixed inset-0 z-70 flex items-center justify-center p-4 pointer-events-none" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col pointer-events-auto border border-gray-100">
                            <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">Chỉnh sửa tin tức</h2>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {contentData.id}</span>
                                </div>
                                <button onClick={() => setIsOpenModal(false)} className="hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer text-slate-500"><MdOutlineClose size={26} /></button>
                            </div>
                            <div className="flex flex-1 overflow-hidden">
                                <div className="w-[380px] p-8 space-y-6 border-r overflow-y-auto bg-white shrink-0 scrollbar-hide">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Tiêu đề bài viết</label>
                                            <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all" value={contentData.title} onChange={(e) => setContentData({ ...contentData, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Ảnh đại diện</label>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelect} />
                                            <div className="relative group rounded-4xl overflow-hidden border-4 border-gray-50 shadow-sm">
                                                <Image width={1000} height={1000} src={contentData.urlAvatar || "https://placehold.co/600x400?text=News+Avatar"} className="w-full aspect-video object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform cursor-pointer"><MdRefresh size={20} /></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Link liên kết</label>
                                            <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:border-blue-500 outline-none transition-all text-slate-500" value={contentData.link} onChange={(e) => setContentData({ ...contentData, link: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Mô tả ngắn</label>
                                            <textarea rows={5} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:border-blue-500 outline-none resize-none leading-relaxed" value={contentData.description} onChange={(e) => setContentData({ ...contentData, description: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="pt-4 space-y-3">
                                        <button onClick={handleUpdateContent} disabled={loading || uploading} className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black shadow-xl hover:bg-blue-600 active:scale-95 transition-all text-xs uppercase flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300">
                                            {loading ? <MdRefresh className="animate-spin" size={20} /> : <MdSave size={20} />}
                                            {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
                                        </button>
                                        <button onClick={() => setIsOpenModal(false)} className="w-full py-4 bg-gray-500 text-white rounded-2xl font-bold hover:bg-gray-600 transition-all text-xs uppercase cursor-pointer">Hủy bỏ</button>
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
                                    <div className="flex-1 flex flex-col items-center justify-start p-8 pt-32">
                                        <div className="relative flex justify-center origin-top transition-all duration-500" style={{ width: viewMode === 'pc' ? '180%' : '100%', transform: `scale(${config.scale})` }}>
                                            <div style={{ width: config.width }} className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[3.5rem] border-14 border-slate-900 h-fit min-h-[600px] overflow-hidden shrink-0">
                                                <div className={`text-center transition-all ${viewMode === 'mobile' ? 'pt-16 pb-12' : 'pt-24 pb-20'}`}>
                                                    <h1 className={`font-black italic uppercase tracking-tighter text-slate-900 leading-none transition-all ${viewMode === 'mobile' ? 'text-5xl' : 'text-8xl'
                                                        }`}>
                                                        Preview <span className="text-blue-600">Update</span>
                                                    </h1>
                                                </div>
                                                <div>
                                                    <div className={`px-14 pb-32 flex justify-center items-center`}>
                                                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-blue-500 overflow-hidden flex flex-col h-full ring-8 ring-blue-500/5">
                                                            <div className="relative h-64 bg-slate-50 shrink-0">
                                                                <Image width={1000} height={1000} src={contentData.urlAvatar || "https://placehold.co/600x400?text=News+Avatar"} className="w-full h-full object-cover" alt="preview" />
                                                            </div>
                                                            <div className="p-10 flex flex-col flex-1">
                                                                <h3 className="text-2xl font-black text-gray-900 uppercase leading-tight mb-4">{contentData.title || "Tiêu đề trống..."}</h3>
                                                                <p className="text-gray-500 text-base leading-relaxed mb-8 font-medium italic">"{contentData.description || "Chưa có mô tả..."}"</p>
                                                                <div className="mt-auto flex items-center gap-2 text-blue-600 font-black text-sm uppercase">
                                                                    Xem chi tiết bài viết <MdRefresh size={18} />
                                                                </div>
                                                            </div>
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

export default EditNew;