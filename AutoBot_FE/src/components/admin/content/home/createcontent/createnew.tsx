'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef } from "react";
import { MdOutlineClose, MdOutlineSmartphone, MdOutlineTabletMac, MdOutlineDesktopWindows, MdSave, MdRefresh, MdOutlineLink, MdCloudUpload, MdDelete } from "react-icons/md";
import { toast } from "sonner";
import axios from "axios";
import handleUpload from "@/components/shared/cloudinary/upload-image";

const CreateNew = ({ isOpenModal, existingNews, accessToken, setIsOpenModal, onRefresh }: { isOpenModal: boolean, existingNews: any, accessToken: string, setIsOpenModal: (val: boolean) => void, onRefresh?: () => void }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'pc'>('pc');

    const [contentData, setContentData] = useState({
        title: '',
        urlAvatar: '',
        link: '',
        description: ''
    });

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const secureUrl = await handleUpload(file);
            if (secureUrl) {
                setContentData(prev => ({ ...prev, urlAvatar: secureUrl }));
            }
        } catch (error) {
            toast.error("Lỗi khi tải ảnh");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateContent = async () => {
        if (!contentData.title.trim()) return toast.error("Thiếu tiêu đề");
        if (!contentData.urlAvatar.trim()) return toast.error("Vui lòng chọn ảnh đại diện");
        if (!contentData.link.trim()) return toast.error("Thiếu link bài viết");
        if (!contentData.description.trim()) return toast.error("Thiếu mô tả");
        setLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Content/CreateContent`, contentData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            toast.success("Thêm tin tức thành công!");
            setContentData({ title: '', urlAvatar: '', link: '', description: '' });
            setIsOpenModal(false);
            if (onRefresh) onRefresh();
        } catch (error: any) {
            const msg = error.response?.data?.message || "Lỗi khi lưu dữ liệu";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const config = viewMode === 'mobile'
        ? { width: 430, scale: 0.8, columns: 'grid-cols-1' }
        : viewMode === 'tablet'
            ? { width: 820, scale: 0.7, columns: 'grid-cols-2' }
            : { width: 1440, scale: 0.5, columns: 'grid-cols-4' };

    return (
        <AnimatePresence>
            {isOpenModal && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsOpenModal(false)} />
                    <motion.div className="fixed inset-0 z-70 flex items-center justify-center p-4 pointer-events-none" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col pointer-events-auto">
                            <div className="flex justify-between items-center p-4 border-b bg-gray-50 shrink-0">
                                <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter">
                                    Thêm tin tức ({existingNews?.length})
                                </h2>
                                <button onClick={() => {
                                    setIsOpenModal(false);
                                    setContentData({ title: '', urlAvatar: '', link: '', description: '' });
                                }} className="hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer"><MdOutlineClose size={24} /></button>
                            </div>
                            <div className="flex flex-1 overflow-hidden">
                                <div className="w-[360px] p-6 space-y-6 border-r overflow-y-auto bg-white shrink-0 scrollbar-hide">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1 text-blue-600 uppercase">Tiêu đề bài viết</label>
                                            <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" value={contentData.title} onChange={(e) => setContentData({ ...contentData, title: e.target.value })} placeholder="VD: Cập nhật thị trường hôm nay..." />
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1 text-blue-600 uppercase">Ảnh đại diện</label>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelect} />
                                            {!contentData.urlAvatar ? (
                                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-600 bg-gray-50 cursor-pointer transition-all">
                                                    {uploading ? <MdRefresh className="animate-spin" size={24} /> : <MdCloudUpload size={32} />}
                                                    <span className="text-[.75rem] font-bold uppercase">{uploading ? "Đang xử lý..." : "Bấm để tải ảnh"}</span>
                                                </button>
                                            ) : (
                                                <div className="relative group rounded-2xl overflow-hidden shadow-lg border">
                                                    <img src={contentData.urlAvatar} className="w-full aspect-video object-cover" alt="Avatar" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                        <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform cursor-pointer"><MdRefresh size={20} /></button>
                                                        <button onClick={() => setContentData({ ...contentData, urlAvatar: '' })} className="p-2 bg-white rounded-full text-red-600 hover:scale-110 transition-transform cursor-pointer"><MdDelete size={20} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1 text-blue-600 uppercase">Link liên kết bài viết</label>
                                            <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" value={contentData.link} onChange={(e) => setContentData({ ...contentData, link: e.target.value })} placeholder="https://news.example.com/..." />
                                        </div>
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1 text-blue-600 uppercase">Mô tả ngắn</label>
                                            <textarea rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" value={contentData.description} onChange={(e) => setContentData({ ...contentData, description: e.target.value })} placeholder="Tóm tắt nội dung chính..." />
                                        </div>
                                    </div>
                                    <div className="pt-3 space-y-3">
                                        <button onClick={handleCreateContent} disabled={loading || uploading} className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-600 active:scale-95 transition-all text-xs uppercase flex items-center justify-center gap-2 cursor-pointer disabled:bg-blue-300">
                                            {loading ? <MdRefresh className="animate-spin" size={18} /> : <MdSave size={18} />}
                                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                                        </button>
                                        <button onClick={() => {
                                            setIsOpenModal(false);
                                            setContentData({ title: '', urlAvatar: '', link: '', description: '' });
                                        }} className="w-full py-4 bg-gray-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-gray-600 active:scale-95 transition-all text-xs uppercase flex items-center justify-center gap-2 cursor-pointer disabled:bg-blue-300">
                                            Hủy bỏ
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-100 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex bg-white p-1 rounded-2xl shadow-xl border border-gray-100">
                                        {(['pc', 'tablet', 'mobile'] as const).map((mode) => (
                                            <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer ${viewMode === mode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>
                                                {mode === 'pc' && <MdOutlineDesktopWindows size={16} />}
                                                {mode === 'tablet' && <MdOutlineTabletMac size={16} />}
                                                {mode === 'mobile' && <MdOutlineSmartphone size={16} />}
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-start p-8 mt-12">
                                        <div className="relative top-[9%] flex justify-center origin-top scrollbar-hide overflow-y-auto w-full h-full" style={{ width: viewMode === 'pc' ? '200%' : '100%', height: viewMode === 'pc' ? '200%' : '180%', transform: `scale(${config.scale})`, transformOrigin: 'top center', transition: 'all 0.4s ease-in-out' }}>
                                            <div style={{ width: config.width }} className="bg-white shadow-2xl rounded-[3rem] border-12 border-slate-900 h-fit min-h-full overflow-hidden shrink-0 mb-20">
                                                <div className="p-12">
                                                    <div className="text-center mb-12"><h1 className="text-5xl font-black italic uppercase text-gray-900 leading-none">MARKET <span className="text-blue-600">NEWS</span></h1></div>
                                                    <div className={`grid ${config.columns} gap-8`}>
                                                        <NewsCard data={contentData} isDraft={true} />
                                                        {existingNews?.slice(0, 3).map((item: any, idx: number) => <NewsCard key={idx} data={item} />)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                                        <div className="flex items-center gap-8 bg-slate-900/90 px-8 py-4 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-0.5">Device Mode</span>
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
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-0.5">Current Scale</span>
                                                <span className="text-sm font-black text-blue-400">{(config.scale * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="w-px h-10 bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-0.5">Resolution</span>
                                                <span className="text-sm font-black text-white tracking-tight">{config.width}px</span>
                                            </div>
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

const NewsCard = ({ data, isDraft = false }: any) => {
    return (
        <div className={`bg-white rounded-[2.5rem] shadow-sm border overflow-hidden flex flex-col h-full transition-all duration-300 ${isDraft ? 'ring-4 ring-blue-500/10 border-blue-600' : 'border-gray-100 opacity-60'}`}>
            <div className="relative h-56 bg-slate-50 shrink-0">
                <img src={data.image || "https://placehold.co/600x400?text=Preview+Image"} className="w-full h-full object-cover" alt="news" />
            </div>
            <div className="p-8 flex flex-col flex-1">
                <h3 className="text-xl font-black text-gray-900 line-clamp-2 uppercase leading-tight mb-4">{data.title || "Tên bài viết..."}</h3>
                <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed mb-6 font-medium">{data.description || "Nội dung tóm tắt sẽ xuất hiện ở đây khi bạn nhập..."}</p>
                <div className="mt-auto text-blue-600 font-black text-xs uppercase italic">Đọc thêm →</div>
            </div>
        </div>
    );
};

export default CreateNew;