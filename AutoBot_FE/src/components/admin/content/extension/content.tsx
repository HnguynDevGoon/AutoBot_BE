'use client';

import { GetAccessToken } from "@/components/shared/token/accessToken";
import { RootState } from "@/redux/store";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BsDownload, BsPlus, BsSearch } from "react-icons/bs";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import CreateNav from "./createcontent/createnav";
import CreateGuid from "./createcontent/createguid";
import EditNav from "./editcontent/editnav";
import EditGuid from "./editcontent/editguid";


const ContentExtension = () => {
    const [activeTab, setActiveTab] = useState<string>('nav-extension');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [listContent, setListContent] = useState<any>([]);
    const [accessToken, setAccessToken] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<string>('');
    const [isOpenNavModal, setIsOpenNavModal] = useState<boolean>(false);
    const [isOpenGuidModal, setIsOpenGuidModal] = useState<boolean>(false);
    const [isOpenEditNavModal, setIsOpenEditNavModal] = useState<boolean>(false);
    const [isOpenEditGuidModal, setIsOpenEditGuidModal] = useState<boolean>(false);

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
        handleGetContent(activeTab);
    }, [activeTab, accessToken]);

    const handleGetContent = async (type: string) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/GetByOtherType?otherType=${type}`);
            if (res.data) {
                setListContent(res.data.data);
            }
        } catch (err) {
            setListContent([]);
        }
    }

    const filteredData = listContent.filter((item: any) =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleContentDelete = async (contentId: string) => {
        if (!accessToken) return toast.error("Phiên đăng nhập đã hết hạn.");

        const result = await Swal.fire({
            title: "Xác nhận xóa?",
            text: `Dữ liệu mở rộng này sẽ bị xóa vĩnh viễn!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Xóa ngay",
            cancelButtonText: "Hủy"
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/DeleteOtherContent?id=${contentId}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                toast.success("Xóa thành công!");
                handleGetContent(activeTab);
            } catch (error) {
                toast.error("Lỗi: Không thể xóa nội dung này.");
            }
        }
    };

    const handleExportReport = () => {
        if (filteredData.length === 0) return toast.error("Không có dữ liệu để xuất file!");
        try {
            const dataToExport = filteredData.map((item: any, index: number) => ({
                "STT": index + 1,
                "Tiêu đề": item.title || "",
                "Mô tả": item.description || "",
                "Phân loại": activeTab === 'nav-extension' ? 'Điều hướng' : 'Hướng dẫn',
                "Ngày tạo": item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy") : "N/A"
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
            const fileName = `Extension_${activeTab}_${format(new Date(), "ddMMyyyy")}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            toast.success("Xuất file thành công!");
        } catch (error) {
            toast.error("Lỗi xuất file.");
        }
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý tiện ích</h1>
                        <p className="text-sm text-gray-500 mt-1">Quản lý nội dung điều hướng và hướng dẫn hệ thống.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExportReport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition shadow-sm cursor-pointer">
                            <BsDownload size={16} />
                            <span>Xuất file</span>
                        </button>
                        <button
                            onClick={() => {
                                activeTab === 'nav-extension'
                                    ? (setIsOpenNavModal(true), setIsOpenGuidModal(false))
                                    : (setIsOpenNavModal(false), setIsOpenGuidModal(true))
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            <BsPlus size={20} />
                            <span>Thêm mới</span>
                        </button>
                    </div>
                </div>

                <CreateNav isOpenModal={isOpenNavModal} setIsOpenModal={setIsOpenNavModal} existingData={listContent} onRefresh={() => handleGetContent(activeTab)} accessToken={accessToken} />
                <CreateGuid isOpenModal={isOpenGuidModal} setIsOpenModal={setIsOpenGuidModal} existingData={listContent} onRefresh={() => handleGetContent(activeTab)} accessToken={accessToken} />

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full lg:w-96">
                        <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm extension..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-gray-100/80 p-1.5 rounded-xl w-full lg:w-auto">
                        <button
                            onClick={() => setActiveTab('nav-extension')}
                            className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'nav-extension' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Điều hướng
                        </button>
                        <button
                            onClick={() => setActiveTab('guid-extension')}
                            className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'guid-extension' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Hướng dẫn
                        </button>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-10">
                    <div className="p-4">
                        {filteredData.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredData.map((item: any) => (
                                    <div key={item.id} className="flex flex-col md:flex-row items-center gap-5 p-4 rounded-2xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all duration-300">
                                        <div className="w-full md:w-36 h-28 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                                            <img
                                                width={400}
                                                height={400}
                                                src={item.icon || "https://via.placeholder.com/150"}
                                                className="w-full h-full object-cover"
                                                alt="icon"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                                                    {activeTab === 'nav-extension' ? 'NAV' : 'GUID'}
                                                </span>
                                            </div>
                                            <h3 className="text-md font-bold text-gray-800 mb-1">{item.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 italic">{item.description}</p>
                                        </div>
                                        <div className="flex gap-2 md:border-l md:pl-5 border-gray-100 w-full md:w-auto">
                                            <button onClick={() => {
                                                setSelectedItem(item.id);
                                                setIsOpenEditNavModal(activeTab === 'nav-extension');
                                                setIsOpenEditGuidModal(activeTab === 'guid-extension');
                                            }} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer border border-transparent hover:border-indigo-100">
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleContentDelete(item.id)}
                                                className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition cursor-pointer border border-transparent hover:border-red-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center">
                                <BsSearch className="mx-auto text-gray-300 mb-3" size={30} />
                                <p className="text-gray-400 text-sm italic">Không có dữ liệu extension.</p>
                            </div>
                        )}
                    </div>

                    <EditNav isOpenModal={isOpenEditNavModal} setIsOpenModal={setIsOpenEditNavModal} data={selectedItem} accessToken={accessToken} onRefresh={() => handleGetContent(activeTab)} />
                    <EditGuid isOpenModal={isOpenEditGuidModal} setIsOpenModal={setIsOpenEditGuidModal} data={selectedItem} accessToken={accessToken} onRefresh={() => handleGetContent(activeTab)} />
                </div>
            </main>
        </div>
    );
};

export default ContentExtension;