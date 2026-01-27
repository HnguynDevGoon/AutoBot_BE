'use client';

import handleUpload from "@/components/shared/cloudinary/upload-image";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
    MdOutlineClose,
    MdRefresh, MdSave, MdStar,
    MdOutlineSmartphone,
    MdOutlineTabletMac,
    MdOutlineDesktopWindows
} from "react-icons/md";
import { toast } from "sonner";

interface ReviewData {
    id?: string;
    fullName: string;
    description: string;
    urlAvatar: string;
    rate: number;
}

interface EditReviewProps {
    isOpenModal: boolean;
    data: any;
    accessToken: string;
    setIsOpenModal: (val: boolean) => void;
    onRefresh?: () => void;
    existingReviews?: any[];
}

const EditReview = ({ isOpenModal, data, accessToken, setIsOpenModal, onRefresh, existingReviews }: EditReviewProps) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contentData, setContentData] = useState<ReviewData>({
        fullName: '',
        description: '',
        urlAvatar: '',
        rate: 0
    });

    const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'pc'>('pc');

    // 1. Lấy dữ liệu chi tiết
    useEffect(() => {
        const fetchDetail = async () => {
            const reviewId = typeof data === 'string' ? data : data?.id;
            if (!reviewId || !isOpenModal) return;

            setFetching(true);
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Review/GetReviewById?id=${reviewId}`);
                const result = response.data.data || response.data;

                setContentData({
                    id: result.id,
                    fullName: result.fullName || result.title || '',
                    description: result.description || '',
                    urlAvatar: result.urlAvatar || result.image || '',
                    rate: result.rate || 0
                });
            } catch (error) {
                toast.error("Không thể lấy thông tin đánh giá");
                setIsOpenModal(false);
            } finally {
                setFetching(false);
            }
        };

        fetchDetail();
    }, [data, isOpenModal]);

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const secureUrl = await handleUpload(file);
            if (secureUrl) {
                setContentData(prev => ({ ...prev, urlAvatar: secureUrl }));
                toast.success("Cập nhật ảnh đại diện thành công!");
            }
        } catch (error) {
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    // 2. Gọi API Update
    const handleUpdateReview = async () => {
        if (!contentData.fullName.trim()) return toast.error("Thiếu họ tên khách hàng");
        if (!contentData.urlAvatar.trim()) return toast.error("Vui lòng tải lên Avatar");
        if (!contentData.description.trim()) return toast.error("Thiếu nội dung đánh giá");
        if (!contentData.rate) return toast.error("Thiếu số sao đánh giá");

        setLoading(true);
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_URL_API}Review/UpdateReview`, contentData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success("Cập nhật đánh giá thành công!");
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
            : { width: 1440, scale: 0.45 }; // Tăng scale lên xíu cho dễ nhìn

    return (
        <AnimatePresence>
            {isOpenModal && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsOpenModal(false)} />
                    <motion.div className="fixed inset-0 z-70 flex items-center justify-center p-4 pointer-events-none" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col pointer-events-auto border border-gray-100 relative">

                            {/* Overlay loading */}
                            {fetching && (
                                <div className="absolute inset-0 bg-white/80 z-100 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                                    <MdRefresh className="animate-spin text-blue-600" size={50} />
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Đang tải dữ liệu...</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center p-4 border-b bg-white shrink-0">
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">Chỉnh sửa đánh giá</h2>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {contentData.id}</span>
                                </div>
                                <button onClick={() => setIsOpenModal(false)} className="hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer text-gray-400">
                                    <MdOutlineClose size={26} />
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden bg-gray-50">
                                {/* FORM SIDE */}
                                <div className="w-[420px] p-8 space-y-6 border-r overflow-y-auto bg-white shrink-0 scrollbar-hide">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Họ tên khách hàng</label>
                                            <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none font-bold focus:border-blue-500 transition-colors" value={contentData.fullName} onChange={(e) => setContentData({ ...contentData, fullName: e.target.value })} />
                                        </div>

                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Avatar khách hàng</label>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelect} />
                                            <div className="relative group w-full h-40 rounded-[2.5rem] overflow-hidden shadow-sm border-4 border-gray-50 bg-gray-50 aspect-square flex items-center justify-center">
                                                <img src={contentData.urlAvatar || "https://placehold.co/100"} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform cursor-pointer"><MdRefresh size={20} /></button>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Số sao đánh giá ({contentData.rate})</label>
                                            <div className="flex gap-2 bg-gray-50 p-3 rounded-2xl justify-center">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <MdStar
                                                        key={star}
                                                        size={30}
                                                        className={`cursor-pointer transition-colors ${star <= contentData.rate ? 'text-yellow-400' : 'text-gray-200'}`}
                                                        onClick={() => setContentData({ ...contentData, rate: star })}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[.75rem] font-black mb-1.5 text-blue-600 uppercase tracking-widest">Nội dung đánh giá</label>
                                            <textarea rows={6} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none resize-none font-medium text-gray-600 leading-relaxed focus:border-blue-500 transition-colors" value={contentData.description} onChange={(e) => setContentData({ ...contentData, description: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="pt-6 space-y-3">
                                        <button onClick={handleUpdateReview} disabled={loading || uploading || fetching} className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black shadow-xl hover:bg-blue-600 active:scale-[0.98] transition-all text-xs uppercase flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300">
                                            {loading ? <MdRefresh className="animate-spin" size={20} /> : <MdSave size={20} />}
                                            {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
                                        </button>
                                        <button onClick={() => setIsOpenModal(false)} className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all text-xs uppercase cursor-pointer">Hủy bỏ</button>
                                    </div>
                                </div>

                                {/* PREVIEW SIDE */}
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
                                            <div style={{ width: config.width }} className="bg-white shadow-2xl rounded-[4rem] border-14 border-slate-900 h-fit min-h-[700px] overflow-hidden shrink-0">
                                                <div className="pt-24 pb-16 text-center">
                                                    <h1 className="text-7xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">PREVIEW <span className="text-blue-600">UPDATE</span></h1>
                                                </div>
                                                
                                                {/* --- PHẦN CHỈNH SỬA: ĐƯA REVIEW RA GIỮA --- */}
                                                <div className="px-14 pb-32">
                                                    {/* Sử dụng Flexbox để căn giữa thay vì Grid */}
                                                    <div className="flex justify-center items-center gap-10 h-full">
                                                        
                                                        {/* Review Card Đang Edit - Hiển thị to và rõ nhất ở giữa */}
                                                        <div className="w-full max-w-[420px] shrink-0 z-10">
                                                            <ReviewCardItem data={contentData} isDraft={true} />
                                                        </div>

                                                        {/* Các Review khác (nếu có) - Hiển thị mờ và nhỏ hơn ở bên cạnh (chỉ hiện trên PC) */}
                                                        {viewMode === 'pc' && existingReviews?.filter(r => r.id !== contentData.id).slice(0, 1).map((item: any, idx: number) => (
                                                            <div key={idx} className="w-full max-w-[380px] shrink-0 opacity-40 blur-[1px] scale-90 grayscale pointer-events-none hidden xl:block">
                                                                <ReviewCardItem data={{
                                                                    fullName: item.title || item.fullName,
                                                                    description: item.description,
                                                                    urlAvatar: item.image || item.urlAvatar,
                                                                    rate: item.rate
                                                                }} />
                                                            </div>
                                                        ))}

                                                    </div>
                                                </div>
                                                {/* ------------------------------------------- */}

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

const ReviewCardItem = ({ data, isDraft = false }: { data: ReviewData, isDraft?: boolean }) => {
    return (
        <div className={`bg-white rounded-[3rem] shadow-xl border-2 transition-all duration-500 flex flex-col items-center text-center p-10 h-full ${isDraft ? 'border-blue-600 ring-12 ring-blue-600/5 scale-105' : 'border-gray-50 opacity-50'}`}>
            <div className="w-24 h-24 bg-gray-50 rounded-full overflow-hidden mb-6 border-4 border-white shadow-md shrink-0">
                <img src={data.urlAvatar || "https://placehold.co/100"} className="w-full h-full object-cover" alt="avatar" />
            </div>
            <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    <MdStar key={i} className={i < data.rate ? "text-yellow-400" : "text-gray-200"} size={20} />
                ))}
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase mb-3 leading-tight">{data.fullName || "TÊN KHÁCH HÀNG"}</h3>
            <p className="text-gray-400 text-sm font-bold leading-relaxed line-clamp-4 italic">"{data.description || "Nội dung phản hồi..."}"</p>
        </div>
    );
};

export default EditReview;