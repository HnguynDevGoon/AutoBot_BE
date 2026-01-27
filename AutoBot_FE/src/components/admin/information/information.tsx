"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios from "axios";
import {
    FaCamera,
    FaPen,
    FaUserCircle,
    FaShieldAlt,
    FaChevronRight,
    FaPhone,
    FaBirthdayCake,
    FaFingerprint,
    FaKey
} from "react-icons/fa";
import { vi } from "date-fns/locale";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { ChangeAvatar, ChangeBirthDay, ChangeInfor, ChangePassword, ChangeTwoStep } from "./change";

const ActionButton = ({ icon: Icon, label, onClick, variant = "default" }: any) => {
    const baseStyle = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform active:scale-95";
    const variants = {
        default: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 border border-transparent",
        ghost: "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
    };

    return (
        <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]}`}>
            {Icon && <Icon />}
            {label}
        </button>
    );
};

const DataCard = ({ label, value, icon: Icon, onClick, isSecure = false }: any) => (
    <div
        onClick={onClick}
        className="group relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:border-blue-200"
    >
        <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                    <div className="mt-1 font-medium text-slate-800 text-base break-all">
                        {isSecure && !value ? (
                            <span className="text-slate-400 italic">Chưa thiết lập</span>
                        ) : isSecure ? (
                            value
                        ) : (
                            value || <span className="text-slate-400 italic">Chưa cập nhật</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <FaChevronRight size={12} />
            </div>
        </div>
    </div>
);

export default function AdminInformationPage() {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [user, setUser] = useState<any>(null);
    const [openInfo, setOpenInfo] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("overview");
    const [birthDay, setBirthDay] = useState<string>('');
    const [accessToken, setAccessToken] = useState<string>('');
    const [selectedTitle, setSelectedTitle] = useState<string>('');
    const [selectedField, setSelectedField] = useState<string>('');
    const [openBirthDay, setOperBirthDay] = useState<boolean>(false);
    const [identify, setIdentify] = useState<string>('');
    const [errInfo, setErrInfo] = useState<any>("");
    const [openTwoStep, setOpenTwoStep] = useState<boolean>(false);
    const [isTwoStep, setIsTwoStep] = useState<boolean>(false);
    const [openPassword, setOpenPassword] = useState<boolean>(false);
    const [openAvatar, setOpenAvatar] = useState<boolean>(false);
    const [errAvatar, setErrAvatar] = useState<any>("");

    useEffect(() => {
        if (!userInfo?.Id && !accessToken) return;
        if (userInfo) setUser(userInfo);
        loadData();
        if (userInfo && accessToken) handleGetInforUser();
    }, [userInfo, accessToken]);

    const loadData = async () => {
        const token = await GetAccessToken(userInfo?.Id);
        if (token) setAccessToken(token);
    };

    const formatBirthday = (date: string) => {
        if (!date) return null;
        try {
            return format(new Date(date), "dd/MM/yyyy", { locale: vi });
        } catch { return null; }
    };

    const handleGetInforUser = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Authen/GetUserById?userId=${userInfo?.Id}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setIsTwoStep(res.data.data.twoStep);
            setUser(res.data.data);
        } catch (err) { }
    }

    return (
        <div className="min-h-screen w-full text-slate-800 font-sans">
            <div className="relative z-10 mx-auto space-y-8">
                <div className="relative bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="h-32 tablet:h-48 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                    <div className="px-6 tablet:px-10 pb-8">
                        <div className="flex flex-col tablet:flex-row items-start tablet:items-end -mt-12 tablet:-mt-16 gap-6">
                            <div className="relative group shrink-0 mx-auto tablet:mx-0">
                                <div className="w-32 h-32 tablet:w-40 tablet:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white relative">
                                    {user?.urlAvatar ? (
                                        <Image
                                            width={160} height={160}
                                            alt="avatar"
                                            src={user.urlAvatar}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                            <FaUserCircle size={60} />
                                        </div>
                                    )}
                                    <div
                                        onClick={() => setOpenAvatar(true)}
                                        className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                    >
                                        <FaCamera className="text-white text-2xl drop-shadow-md" />
                                    </div>
                                </div>
                                <div
                                    onClick={() => setOpenAvatar(true)}
                                    className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md text-slate-600 cursor-pointer hover:text-blue-600 tablet:hidden"
                                >
                                    <FaCamera size={14} />
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col tablet:flex-row items-center tablet:items-end justify-between w-full gap-4 text-center tablet:text-left mb-2">
                                <div>
                                    <h1 className="text-2xl tablet:text-3xl font-bold text-slate-900">{user?.fullName || "Chưa đặt tên"}</h1>
                                    <p className="text-slate-500 font-medium">@{user?.userName || "username"}</p>
                                </div>
                                <div className="flex gap-3">
                                    <ActionButton
                                        icon={FaPen}
                                        label="Sửa thông tin"
                                        onClick={() => { setSelectedTitle("Họ và tên"); setSelectedField("fullName"); setIdentify(user?.fullName || ""); setOpenInfo(true) }}
                                    />
                                    <ActionButton
                                        variant="primary"
                                        icon={FaShieldAlt}
                                        label="Bảo mật"
                                        onClick={() => {
                                            document.getElementById('security-section')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 laptop:grid-cols-3 gap-6 tablet:gap-8">
                    <div className="laptop:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                            Thông tin cá nhân
                        </h2>

                        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
                            <DataCard
                                label="Họ và tên"
                                value={user?.fullName}
                                icon={FaUserCircle}
                                onClick={() => { setSelectedTitle("Họ và tên"); setSelectedField("fullName"); setIdentify(user?.fullName || ""); setOpenInfo(true) }}
                            />
                            <DataCard
                                label="Tên người dùng"
                                value={user?.userName}
                                icon={FaFingerprint}
                                onClick={() => { setSelectedTitle("Tên người dùng"); setSelectedField("userName"); setIdentify(user?.userName || ""); setOpenInfo(true) }}
                            />
                            <DataCard
                                label="Số điện thoại"
                                value={user?.phoneNumber}
                                icon={FaPhone}
                                onClick={() => { setSelectedTitle("Số điện thoại"); setSelectedField("phoneNumber"); setIdentify(user?.phoneNumber || ""); setOpenInfo(true) }}
                            />
                            <DataCard
                                label="Ngày sinh"
                                value={formatBirthday(user?.birthDay)}
                                icon={FaBirthdayCake}
                                onClick={() => setOperBirthDay(true)}
                            />
                        </div>

                        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg">Tài khoản của bạn đang hoạt động tốt</h3>
                                <p className="text-slate-300 text-sm mt-1 max-w-md">Hãy thường xuyên cập nhật mật khẩu và bảo mật 2 lớp để giữ an toàn tuyệt đối cho thông tin cá nhân.</p>
                            </div>
                            <FaShieldAlt className="absolute -right-5 -bottom-5 text-slate-700/50 text-[150px] rotate-12 z-0" />
                        </div>
                    </div>

                    <div className="space-y-6" id="security-section">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                            Bảo mật
                        </h2>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1">
                            <div
                                onClick={() => setOpenPassword(true)}
                                className="p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <FaKey />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">Đổi mật khẩu</p>
                                        <p className="text-xs text-slate-500">Cập nhật lần cuối: 30 ngày trước</p>
                                    </div>
                                </div>
                                <FaChevronRight className="text-slate-300 group-hover:text-purple-600 transition-colors" />
                            </div>

                            <div className="w-full h-1 bg-slate-100 my-1"></div>

                            <div
                                onClick={() => setOpenTwoStep(true)}
                                className="p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${user?.twoStep ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                        <FaShieldAlt />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">Xác thực 2 bước</p>
                                        <p className={`text-xs font-medium ${user?.twoStep ? 'text-green-600' : 'text-orange-500'}`}>
                                            {user?.twoStep ? 'Đang bật bảo vệ' : 'Khuyến nghị bật'}
                                        </p>
                                    </div>
                                </div>
                                <FaChevronRight className="text-slate-300 group-hover:text-purple-600 transition-colors" />
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                            <h4 className="font-bold text-blue-800 text-sm mb-2">Trạng thái xác thực</h4>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-blue-700/70">Cấp độ bảo mật</span>
                                    <span className="font-bold text-blue-800">{user?.twoStep ? 'Cao' : 'Trung bình'}</span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
                                    <div
                                        className={`h-1.5 rounded-full ${user?.twoStep ? 'bg-green-500 w-full' : 'bg-orange-400 w-1/2'}`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <>
                    {openInfo &&
                        <ChangeInfor
                            title={selectedTitle}
                            field={selectedField}
                            userId={userInfo?.Id}
                            user={user}
                            accessToken={accessToken}
                            identify={identify}
                            setUser={setUser}
                            setIdentify={setIdentify}
                            errIdentify={errInfo}
                            setOpenInfo={setOpenInfo}
                            setErrInfo={setErrInfo}
                        />
                    }
                    {openBirthDay &&
                        <ChangeBirthDay
                            title="Ngày sinh"
                            birthDay={user.birthDay}
                            userId={user.id}
                            user={user}
                            setUser={setUser}
                            accessToken={accessToken}
                            setOpenChangeBirthDay={setOperBirthDay}
                            setBirthDay={setBirthDay}
                        />
                    }
                    {openTwoStep &&
                        <ChangeTwoStep
                            title="Xác thực 2 bước"
                            isTwoStep={isTwoStep}
                            setIsTwoStep={setIsTwoStep}
                            userId={userInfo?.Id}
                            setOpenTwoStep={setOpenTwoStep}

                        />
                    }
                    {openPassword &&
                        <ChangePassword
                            title="Mật khẩu"
                            user={user}
                            setUser={setUser}
                            accessToken={accessToken}
                            isPassWord={user.passWord}
                            setOpenPassword={setOpenPassword}
                        />
                    }
                    {openAvatar &&
                        <ChangeAvatar
                            title="Ảnh đại diện"
                            selectedAvatar={user.urlAvatar}
                            setSelectedAvatar={(val: any) => setUser((prev: any) => ({ ...prev, urlAvatar: val }))}
                            user={user}
                            accessToken={accessToken}
                            setUser={setUser}
                            setOpenAvatar={setOpenAvatar}
                            setErrAvatar={setErrAvatar}
                        />
                    }
                </>
            </div>
        </div>
    );
}