'use client';

import handleUpload from "@/components/shared/cloudinary/upload-image";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { 
    MdOutlineClose, 
    MdRefresh, MdSave, MdOutlineSmartphone, 
    MdOutlineTabletMac, MdOutlineDesktopWindows,
    MdAutoAwesome
} from "react-icons/md";
import { toast } from "sonner";

interface EditNavProps {
    isOpenModal: boolean;
    data: any;
    accessToken: string;
    setIsOpenModal: (val: boolean) => void;
    onRefresh?: () => void;
}

const EditNav = ({ isOpenModal, data, accessToken, setIsOpenModal, onRefresh }: EditNavProps) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contentData, setContentData] = useState({
        id: '',
        title: '',
        description: '',
        icon: '',
        otherType: 'nav-extension'
    });

    const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'pc'>('pc');

    // Lấy chi tiết Data từ API
    const fetchNavDetail = async (id: string) => {
        setFetching(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/GetOtherContentById?id=${id}`);
            if (res.data && res.data.data) {
                const item = res.data.data;
                setContentData({
                    id: item.id || '',
                    title: item.title || '',
                    description: item.description || '',
                    icon: item.icon || '',
                    otherType: 'nav-extension'
                });
            }
        } catch (error) {
            toast.error("Không thể tải thông tin điều hướng");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (isOpenModal && data) {
            const navId = typeof data === 'string' ? data : data.id;
            if (navId) fetchNavDetail(navId);
        }
    }, [data, isOpenModal]);

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const secureUrl = await handleUpload(file);
            if (secureUrl) {
                setContentData(prev => ({ ...prev, icon: secureUrl }));
                toast.success("Cập nhật icon thành công!");
            }
        } catch (error) {
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateNav = async () => {
        if (!contentData.title.trim()) return toast.error("Vui lòng nhập tiêu đề");
        if (!contentData.icon.trim()) return toast.error("Vui lòng chọn icon");

        setLoading(true);
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/UpdateOtherContent`, contentData, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json' 
                }
            });

            toast.success("Cập nhật điều hướng thành công!");
            setIsOpenModal(false);
            if (onRefresh) onRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
        } finally {
            setLoading(false);
        }
    };

    const config = viewMode === 'mobile' ? { width: 430, scale: 0.8 } : viewMode === 'tablet' ? { width: 820, scale: 0.7 } : { width: 1440, scale: 0.5 };

    return (
        <AnimatePresence>
            {isOpenModal && (
                <>
                    <motion.div className="fixed inset-0 bg-slate-900/60 z-60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsOpenModal(false)} />
                    <motion.div className="fixed inset-0 z-70 flex items-center justify-center p-4 pointer-events-none" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col pointer-events-auto border border-gray-100">

                            {/* Header */}
                            <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">Cập nhật Navigation</h2>
                                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">ID: {contentData.id}</span>
                                </div>
                                <button onClick={() => setIsOpenModal(false)} className="hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer text-slate-500"><MdOutlineClose size={26} /></button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* FORM SIDE */}
                                <div className="w-[380px] p-8 space-y-6 border-r overflow-y-auto bg-white shrink-0 scrollbar-hide">
                                    {fetching ? (
                                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                                            <MdRefresh className="animate-spin" size={40} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Đang tải dữ liệu...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Tiêu đề Navigation</label>
                                                <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all" value={contentData.title} onChange={(e) => setContentData({ ...contentData, title: e.target.value })} />
                                            </div>

                                            <div>
                                                <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Icon nhận diện</label>
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelect} />
                                                <div className="relative group rounded-4xl overflow-hidden border-4 border-gray-50 shadow-sm bg-slate-50 aspect-square flex items-center justify-center p-8">
                                                    {contentData.icon ? (
                                                        <img src={contentData.icon} className="w-full h-full object-contain" alt="Preview" />
                                                    ) : (
                                                        <MdAutoAwesome className="text-slate-200" size={60} />
                                                    )}
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform cursor-pointer"><MdRefresh size={20} /></button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Mô tả chức năng</label>
                                                <textarea rows={5} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:border-indigo-500 outline-none resize-none leading-relaxed" value={contentData.description} onChange={(e) => setContentData({ ...contentData, description: e.target.value })} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 space-y-3">
                                        <button onClick={handleUpdateNav} disabled={loading || uploading || fetching} className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black shadow-xl hover:bg-blue-600 active:scale-95 transition-all text-xs uppercase flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300">
                                            {loading ? <MdRefresh className="animate-spin" size={20} /> : <MdSave size={20} />}
                                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                                        </button>
                                        <button onClick={() => setIsOpenModal(false)} className="w-full py-4 bg-gray-100 text-slate-500 rounded-2xl font-bold hover:bg-gray-200 transition-all text-xs uppercase cursor-pointer">Hủy bỏ</button>
                                    </div>
                                </div>

                                {/* PREVIEW SIDE */}
                                <div className="flex-1 bg-slate-200 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex bg-white/80 backdrop-blur p-1 rounded-2xl shadow-xl border border-white">
                                        {(['pc', 'tablet', 'mobile'] as const).map((mode) => (
                                            <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer ${viewMode === mode ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-white'}`}>
                                                {mode === 'pc' && <MdOutlineDesktopWindows size={16} />}
                                                {mode === 'tablet' && <MdOutlineTabletMac size={16} />}
                                                {mode === 'mobile' && <MdOutlineSmartphone size={16} />}
                                                {mode}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex-1 flex flex-col items-center justify-start p-8 pt-32">
                                        <div className="relative flex justify-center origin-top transition-all duration-500" style={{ width: viewMode === 'pc' ? '180%' : '100%', transform: `scale(${config.scale})` }}>
                                            <div style={{ width: config.width }} className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.15)] rounded-[4rem] border-14 border-slate-900 h-fit min-h-[700px] overflow-hidden shrink-0">
                                                <div className={`text-center transition-all ${viewMode === 'mobile' ? 'pt-16 pb-12' : 'pt-24 pb-20'}`}>
                                                    <h1 className={`font-black italic uppercase tracking-tighter text-slate-900 leading-none transition-all ${viewMode === 'mobile' ? 'text-5xl' : 'text-8xl'}`}>
                                                        Preview <span className="text-indigo-600">Update</span>
                                                    </h1>
                                                </div>

                                                <div className="px-14 pb-32 flex justify-center">
                                                    {/* Nav Item Card Preview */}
                                                    <div className="w-full max-w-sm bg-slate-800 rounded-[3.5rem] p-10 flex flex-col items-center text-center shadow-2xl ring-8 ring-indigo-500/10">
                                                        <div className="w-24 h-24 bg-white rounded-4xl flex items-center justify-center mb-8 shadow-xl p-5">
                                                            {contentData.icon ? (
                                                                <img src={contentData.icon} className="w-full h-full object-contain" alt="icon" />
                                                            ) : (
                                                                <MdAutoAwesome className="text-indigo-600" size={40} />
                                                            )}
                                                        </div>
                                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4 leading-tight">
                                                            {contentData.title || "TÊN CHỨC NĂNG"}
                                                        </h3>
                                                        <p className="text-slate-400 text-sm font-medium leading-relaxed italic line-clamp-3">
                                                            "{contentData.description || "Mô tả ngắn về chức năng sẽ hiển thị tại đây..."}"
                                                        </p>
                                                        <div className="w-10 h-1 bg-indigo-500 rounded-full mt-8 opacity-50"></div>
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

export default EditNav;