'use client';

import { useEffect, useRef, useState } from "react";
import { 
    UploadCloud, X, File, CheckCircle2,
    CloudIcon, AlertCircle
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { toast } from "sonner";
import axios from "axios";

const ManagementFile = () => {
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState<boolean>(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    const addFiles = (files: File[]) => {
        setSelectedFiles((prev) => [...prev, ...files]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            addFiles(files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            addFiles(files);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpload = async () => {
    if (selectedFiles.length === 0) {
        toast.error("Vui lòng chọn ít nhất một file!");
        return;
    }

    const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (fileExtension === 'js') {
            return axios.post(`${process.env.NEXT_PUBLIC_URL_API}admin/upload`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${accessToken}` 
                }
            });
        } 
        else if (fileExtension === 'rar') {
            return axios.post(`${process.env.NEXT_PUBLIC_URL_API}admin/upload-ext`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${accessToken}` 
                }
            });
        } 
        else {
            toast.error(`Định dạng .${fileExtension} của file ${file.name} không được hỗ trợ.`);
        }
    });

    toast.promise(
        Promise.all(uploadPromises),
        {
            loading: 'Đang xử lý tải lên từng loại file...',
            success: () => {
                setSelectedFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return toast.success('Upload file Script thành công!');
            },
            error: (err) => {
                return toast.error(err.response?.data || err.message || 'Tải lên thất bại');
            },
        }
    );
};

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 w-fulloverflow-hidden">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Quản lý tài liệu
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                            Tải lên và quản lý các tệp tin trong hệ thống AutoBot.
                        </p>
                    </div>
                    <button
                        onClick={handleUpload}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-lg shadow-blue-200 transition transform hover:-translate-y-0.5 cursor-pointer disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                        disabled={selectedFiles.length === 0}
                    >
                        <UploadCloud size={16} /> Bắt đầu tải lên
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2">
                        <div 
                            className={`relative h-[400px] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center bg-white ${
                                dragActive ? "border-blue-500 bg-blue-50/50 scale-[1.01]" : "border-gray-300 hover:border-blue-400"
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                multiple 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                onChange={handleChange}
                            />
                            
                            <div className="flex flex-col items-center text-center p-6 pointer-events-none">
                                <div className="p-4 bg-blue-100 rounded-full text-blue-600 mb-4">
                                    <CloudIcon size={48} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Kéo thả file vào đây hoặc nhấp để chọn
                                </h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Hỗ trợ các định dạng JS, PDF, DOCX, XLSX, Image, RAR (Tối đa 25MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                                <span className="font-semibold text-gray-700 flex items-center gap-2">
                                    Danh sách chờ ({selectedFiles.length})
                                </span>
                                {selectedFiles.length > 0 && (
                                    <button 
                                        onClick={() => {
                                            setSelectedFiles([]);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                        className="text-xs text-red-500 hover:underline cursor-pointer"
                                    >
                                        Xóa tất cả
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {selectedFiles.length > 0 ? (
                                    selectedFiles.map((file, index) => (
                                        <div 
                                            key={`${file.name}-${index}`}
                                            className="group flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-200 transition"
                                        >
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <File size={20} className="text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => removeFile(index)}
                                                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <AlertCircle size={32} className="text-gray-300 mb-2" />
                                        <p className="text-sm text-gray-400">Chưa có file nào được chọn</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="text-amber-500 mt-0.5" size={18} />
                    <div className="text-sm text-amber-800">
                        <p className="font-semibold">Lưu ý bảo mật:</p>
                        <p className="opacity-80">Các tệp tin sau khi tải lên sẽ được kiểm tra virus tự động. Đảm bảo bạn có quyền sở hữu đối với các tài liệu này.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManagementFile;