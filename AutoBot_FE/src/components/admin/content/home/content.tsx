'use client';
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BsSearch, BsPlus, BsDownload } from "react-icons/bs";
import { ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { IoBook } from "react-icons/io5";
import { FaStar } from "react-icons/fa";
import * as XLSX from 'xlsx';

// Import các Modal
import CreatFeature from "./createcontent/createfeature";
import CreateReview from "./createcontent/createreview";
import CreateNew from "./createcontent/createnew";
import EditNew from "./editcontent/editnew";
import EditFeature from "./editcontent/editfeature";
import EditReview from "./editcontent/editreview";

const ContentHome = () => {
    const otherType = 'features-home';
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [listContent, setListContent] = useState<any>({ items: [], totalItems: 0, totalPages: 0 });
    const [accessToken, setAccessToken] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('news');
    const [selectedItem, setSelectedItem] = useState<any>();
    const [isOpenNewsModal, setIsOpenNewsModal] = useState<boolean>(false);
    const [isOpenFeaturesModal, setIsOpenFeaturesModal] = useState<boolean>(false);
    const [isOpenReviewsModal, setIsOpenReviewsModal] = useState<boolean>(false);
    const [isOpenEditNewsModal, setIsOpenEditNewsModal] = useState<boolean>(false);
    const [isOpenEditFeaturesModal, setIsOpenEditFeaturesModal] = useState<boolean>(false);
    const [isOpenEditReviewsModal, setIsOpenEditReviewsModal] = useState<boolean>(false);

    useEffect(() => {
        const init = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        init();
    }, [userInfo]);

    useEffect(() => {
        handleGetContent(currentPage, activeTab);
    }, [currentPage, accessToken, activeTab]);

    const handleGetContent = async (page: number, type: string) => {
        try {
            let res: any;
            let mappedItems: any[] = [];
            const apiUrl = process.env.NEXT_PUBLIC_URL_API;
            const pageSize = process.env.NEXT_PUBLIC_PAGE_SIZE || 10;

            switch (activeTab) {
                case 'news':
                    res = await axios.get(`${apiUrl}Content/GetListContent?pageSize=${pageSize}&pageNumber=${page}&type=${type}`);
                    mappedItems = res.data.data.items.map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        image: item.urlAvatar,
                        date: item.createdDate,
                        tag: 'Tin tức'
                    }));
                    break;
                case 'features':
                    res = await axios.get(`${apiUrl}OtherContent/GetByOtherType?otherType=${otherType}`);
                    mappedItems = res.data.data.map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        image: item.icon,
                        isIcon: true,
                        otherType: item.otherType,
                        tag: 'Tính năng'
                    }));
                    break;
                case 'reviews':
                    res = await axios.get(`${apiUrl}Review/GetAllReviews`);
                    mappedItems = res.data.data.map((item: any) => ({
                        id: item.id,
                        title: item.fullName,
                        description: item.description || "Không có nội dung đánh giá",
                        image: item.urlAvatar,
                        rate: item.rate,
                        tag: 'Đánh giá'
                    }));
                    break;
            }
            setListContent({
                ...(activeTab === 'news' ? res.data.data : {}),
                items: mappedItems
            });
        } catch (err) {
            console.error("Lỗi lấy danh sách:", err);
        }
    };

    const handleContentDelete = async (contentId: string) => {
        if (!accessToken) return toast.error("Vui lòng đăng nhập.");
        const result = await Swal.fire({
            title: "Xác nhận xóa?",
            text: "Thao tác này không thể hoàn tác!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Xóa ngay",
            cancelButtonText: "Hủy",
        });
        if (result.isConfirmed) {
            try {
                const config = { headers: { 'Authorization': `Bearer ${accessToken}` } };
                const apiUrl = process.env.NEXT_PUBLIC_URL_API;
                switch (activeTab) {
                    case 'news':
                        await axios.delete(`${apiUrl}Content/DeleteContent?id=${contentId}`, config);
                        break;
                    case 'features':
                        await axios.delete(`${apiUrl}OtherContent/DeleteOtherContent?id=${contentId}`, config);
                        break;
                    case 'reviews':
                        await axios.delete(`${apiUrl}Review/DeleteReview?id=${contentId}`, config);
                        break;
                }
                toast.success("Đã xóa thành công.");
                handleGetContent(currentPage, activeTab);
            } catch (error) {
                toast.error("Xóa thất bại.");
            }
        }
    };

    const handleExportReport = async () => {
        if (listContent.items.length === 0) return toast.error("Không có dữ liệu!");
        const tabNames: any = { news: "Tin tức", features: "Tính năng", reviews: "Đánh giá" };
        const result = await Swal.fire({
            title: "Xuất báo cáo?",
            text: `Bạn muốn tải file Excel ${tabNames[activeTab]}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Tải về",
        });

        if (result.isConfirmed) {
            const dataToExport = listContent.items.map((item: any, index: number) => {
                const base: any = { "STT": index + 1, "Tiêu đề": item.title, "Mô tả": item.description };
                switch (activeTab) {
                    case 'news': base["Ngày"] = item.date ? format(new Date(item.date), "dd/MM/yyyy") : ""; break;
                    case 'features': base["Loại"] = item.otherType; break;
                    case 'reviews': base["Sao"] = item.rate; break;
                }
                return base;
            });

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Data");
            XLSX.writeFile(wb, `Bao_cao_${activeTab}.xlsx`);
            toast.success("Xuất file thành công!");
        }
    };

    const filteredItems = listContent.items.filter((item: any) =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý trang chủ</h1>
                        <p className="text-sm text-gray-500 mt-1">Quản lý nội dung hiển thị trên Website.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExportReport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition shadow-sm cursor-pointer">
                            <BsDownload size={16} />
                            <span>Xuất báo cáo</span>
                        </button>
                        <button onClick={() => {
                            setIsOpenNewsModal(activeTab === 'news');
                            setIsOpenFeaturesModal(activeTab === 'features');
                            setIsOpenReviewsModal(activeTab === 'reviews');
                        }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition transform hover:-translate-y-0.5 cursor-pointer">
                            <BsPlus size={20} />
                            <span>Thêm mới</span>
                        </button>
                    </div>
                </div>

                <CreateNew isOpenModal={isOpenNewsModal} setIsOpenModal={setIsOpenNewsModal} existingNews={listContent.items} onRefresh={() => handleGetContent(currentPage, activeTab)} accessToken={accessToken} />
                <CreatFeature isOpenModal={isOpenFeaturesModal} setIsOpenModal={setIsOpenFeaturesModal} existingFeatures={listContent.items} onRefresh={() => handleGetContent(currentPage, activeTab)} accessToken={accessToken} />
                <CreateReview isOpenModal={isOpenReviewsModal} setIsOpenModal={setIsOpenReviewsModal} existingReviews={listContent.items} onRefresh={() => handleGetContent(currentPage, activeTab)} accessToken={accessToken} />

                <div className="bg-white p-4 rounded-2xl shadow-sm border mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nội dung..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-gray-100/50 p-1 rounded-2xl overflow-x-auto">
                        {[
                            { id: 'news', label: 'Tin tức' },
                            { id: 'features', label: 'Tính năng' },
                            { id: 'reviews', label: 'Đánh giá' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item: any) => (
                            <motion.div layout key={`${activeTab}-${item.id}`} className="group flex flex-col md:flex-row items-center gap-6 p-5 rounded-2xl bg-white border hover:border-blue-200 hover:shadow-lg transition-all">
                                <div className="relative shrink-0">
                                    {item.isIcon ? (
                                        <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><IoBook size={48} /></div>
                                    ) : (
                                        <img src={item.image || "/placeholder.jpg"} className={`w-full md:w-48 h-32 rounded-xl object-cover ${activeTab === 'reviews' ? 'md:w-32 md:h-32 rounded-full border-4 border-blue-50' : ''}`} alt="" />
                                    )}
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase">{item.tag}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] text-gray-400">{item.date ? format(new Date(item.date), "dd/MM/yyyy") : "Hệ thống"}</span>
                                        {activeTab === 'reviews' && (
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => <FaStar key={i} size={14} className={i < (item.rate || 5) ? "text-yellow-400" : "text-gray-200"} />)}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600">{item.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1 italic">{item.description}</p>
                                </div>
                                <div className="flex items-center gap-2 border-l pl-4">
                                    <button onClick={() => {
                                        setSelectedItem(item.id);
                                        setIsOpenEditNewsModal(activeTab === 'news');
                                        setIsOpenEditFeaturesModal(activeTab === 'features');
                                        setIsOpenEditReviewsModal(activeTab === 'reviews');
                                    }} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleContentDelete(item.id)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl cursor-pointer">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                            <p className="text-gray-400">Không tìm thấy nội dung phù hợp.</p>
                        </div>
                    )}
                </div>

                <EditNew isOpenModal={isOpenEditNewsModal} setIsOpenModal={setIsOpenEditNewsModal} data={selectedItem} accessToken={accessToken} onRefresh={() => handleGetContent(currentPage, activeTab)} />
                <EditFeature isOpenModal={isOpenEditFeaturesModal} setIsOpenModal={setIsOpenEditFeaturesModal} data={selectedItem} accessToken={accessToken} onRefresh={() => handleGetContent(currentPage, activeTab)} />
                <EditReview isOpenModal={isOpenEditReviewsModal} setIsOpenModal={setIsOpenEditReviewsModal} data={selectedItem} accessToken={accessToken} onRefresh={() => handleGetContent(currentPage, activeTab)} />

                {listContent.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border rounded-xl disabled:opacity-30 cursor-pointer"><ChevronLeft size={18} /></button>
                        {Array.from({ length: listContent.totalPages }, (_, i) => (
                            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl text-sm font-bold ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-lg" : "text-gray-600 hover:bg-white"}`}>
                                {i + 1}
                            </button>
                        ))}
                        <button disabled={currentPage === listContent.totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border rounded-xl disabled:opacity-30 cursor-pointer"><ChevronRight size={18} /></button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ContentHome;