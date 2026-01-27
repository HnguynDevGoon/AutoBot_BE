'use client';

import { RootState } from "@/redux/store";
import { getDeviceFingerprint as getCurrentFingerprint } from "@/utils/getDeviceFingerprint";
import getDeviceInfoFromFingerprint from "@/utils/deviceUtils";

import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaDesktop, FaMobileAlt, FaTabletAlt, FaTrash } from "react-icons/fa";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { GetAccessToken } from "../shared/token/accessToken";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const DeviceIcon = ({ type }: { type: string }) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("mobile")) return <FaMobileAlt className="text-blue-400 text-2xl" />;
    if (t.includes("tablet")) return <FaTabletAlt className="text-purple-400 text-2xl" />;
    return <FaDesktop className="text-green-400 text-2xl" />;
};

const Devices = () => {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [devices, setDevices] = useState<any[]>([]);
    const [isModalLogoutAll, setIsModalLogoutAll] = useState<boolean>(false);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<any>(null);
    const [accessToken, setAccessToken] = useState<string>('');
    const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null);

    useEffect(() => {
        setCurrentFingerprint(getCurrentFingerprint());
    }, []);

    useEffect(() => {
        if (!userInfo?.Id) return;

        const initializeData = async () => {
            try {
                const token = await GetAccessToken(userInfo.Id);

                if (token) {
                    setAccessToken(token);
                    await fetchDevices(token);
                }
            } catch (error) {
                console.error("Lỗi khởi tạo dữ liệu:", error);
            }
        };

        initializeData();
    }, [userInfo?.Id]);

    const fetchDevices = async (accessToken: string) => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Device/GetDevices`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
            setDevices(res.data || []);
        } catch (error) {
            console.error("Lỗi tải thiết bị:", error);
        }
    };

    const handleLogoutOtherDevices = async () => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Device/LogoutAllDevices`, {},
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );
            toast.success("Đã đăng xuất tất cả thiết bị khác.");
            setIsModalLogoutAll(false);
            fetchDevices(accessToken);
        } catch (error) {
            toast.error("Lỗi khi đăng xuất thiết bị khác.");
        }
    };

    const handleLogoutOneDevice = async (accessToken: string) => {
        if (!selectedDeviceId) return;
        try {
            // Backend nhận query param deviceId
            await axios.delete(`${process.env.NEXT_PUBLIC_URL_API}Device/LogoutDevice?deviceId=${selectedDeviceId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            toast.success("Đăng xuất thành công");
            setSelectedDeviceId(null); // Đóng modal
            fetchDevices(accessToken);
        } catch (err) {
            toast.error("Đăng xuất thất bại");
        }
    }

    // Tách thiết bị hiện tại và thiết bị khác
    // So sánh Fingerprint để tìm thiết bị hiện tại
    const currentDevice = devices.find(d => d.fingerprint === currentFingerprint) ||
        devices.find(d => d.accessToken === accessToken); // Fallback: so sánh token nếu fingerprint bị lệch

    const otherDevices = devices.filter(d => d.id !== currentDevice?.id);

    return (
        <div className="mt-10 text-white space-y-8">
            {/* --- PHẦN THIẾT BỊ HIỆN TẠI --- */}
            <div>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl text-black dark:text-white font-bold mb-3">Thiết bị hiện tại</h2>
                    <button
                        onClick={() => setIsModalLogoutAll(true)}
                        className="text-red-500 font-semibold text-sm hover:underline transition cursor-pointer"
                    >
                        Đăng xuất tất cả thiết bị khác
                    </button>
                </div>

                {currentDevice ? (() => {
                    const info = getDeviceInfoFromFingerprint(currentDevice.fingerprint);
                    return (
                        <div className="p-4 bg-green-600 rounded-lg shadow-lg border border-green-500">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <DeviceIcon type={info?.deviceType || 'Desktop'} />
                                    <div>
                                        <p className="text-lg font-semibold">
                                            {info ? `${info.browser} / ${info.os}` : "Thiết bị không xác định"}
                                        </p>
                                        <p className="text-sm opacity-80">{info?.deviceType}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-black bg-opacity-20 rounded text-xs whitespace-nowrap">
                                    Đang sử dụng
                                </span>
                            </div>
                            <p className="mt-2 text-sm">
                                Hoạt động: <span className="font-medium">Vừa xong</span>
                            </p>
                        </div>
                    );
                })() : (
                    <div className="p-4 bg-gray-500 rounded-lg opacity-80">
                        Đang xác định thiết bị hiện tại... (Token: {accessToken ? "OK" : "..."})
                    </div>
                )}
            </div>

            {/* --- DANH SÁCH THIẾT BỊ KHÁC --- */}
            <div>
                <h2 className="text-xl text-black dark:text-white font-bold mb-3">Các thiết bị đã đăng nhập ({otherDevices.length})</h2>

                {otherDevices.length === 0 ? (
                    <p className="opacity-70 text-black dark:text-white">Không có thiết bị nào khác.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {otherDevices.map((d) => {
                            const info = getDeviceInfoFromFingerprint(d.fingerprint);
                            return (
                                <div
                                    key={d.id}
                                    onClick={() => {
                                        setSelectedDeviceId(d.id);
                                        setSelectedDeviceInfo(info);
                                    }}
                                    className="p-4 bg-gray-400 rounded-lg shadow-md hover:bg-gray-500 transition border border-gray-400 cursor-pointer group"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="text-gray-700">
                                                <DeviceIcon type={info?.deviceType || 'Desktop'} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-black">
                                                    {info ? `${info.browser} / ${info.os}` : "Không xác định"}
                                                </p>
                                                <p className="text-xs text-gray-700">{info?.deviceType}</p>
                                            </div>
                                        </div>
                                        <FaTrash className="text-gray-600 group-hover:text-red-600 text-xl transition-colors" />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-800">
                                        Hoạt động cuối: {d.lastActive ? format(new Date(d.lastActive), "dd/MM/yyyy HH:mm", { locale: vi }) : "N/A"}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- MODAL 1: ĐĂNG XUẤT TẤT CẢ --- */}
            <AnimatePresence>
                {isModalLogoutAll && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-50 z-60"
                            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalLogoutAll(false)}
                        />
                        <motion.div
                            className="fixed inset-0 z-70 flex items-center justify-center p-4"
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="bg-white text-black rounded-xl shadow-xl p-6 w-full max-w-md">
                                <h2 className="text-lg font-bold mb-4">Đăng xuất tất cả nơi khác?</h2>
                                <p className="mb-6 text-gray-600">Hành động này sẽ đăng xuất tài khoản của bạn khỏi tất cả các trình duyệt và thiết bị khác.</p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-black transition"
                                        onClick={() => setIsModalLogoutAll(false)}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition"
                                        onClick={handleLogoutOtherDevices}
                                    >
                                        Đồng ý
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- MODAL 2: ĐĂNG XUẤT 1 THIẾT BỊ (ĐÃ SỬA LỖI LOOP) --- */}
            <AnimatePresence>
                {selectedDeviceId && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-50 z-60"
                            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedDeviceId(null)}
                        />
                        <motion.div
                            className="fixed inset-0 z-70 flex items-center justify-center p-4"
                            initial={{ y: "20%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} exit={{ y: "20%", opacity: 0 }}
                        >
                            <div className="bg-white text-black rounded-xl shadow-xl p-6 w-full max-w-md">
                                <h2 className="text-lg font-bold mb-2">Đăng xuất thiết bị này?</h2>
                                <p className="mb-6 text-gray-600 bg-gray-100 p-3 rounded">
                                    {selectedDeviceInfo?.browser} trên {selectedDeviceInfo?.os}
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-black transition"
                                        onClick={() => setSelectedDeviceId(null)}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition"
                                        onClick={() => handleLogoutOneDevice(accessToken)}
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Devices;