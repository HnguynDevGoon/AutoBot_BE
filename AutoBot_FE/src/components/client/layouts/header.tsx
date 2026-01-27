'use client';
import { RootState } from "@/redux/store";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { FaCog, FaUser } from "react-icons/fa";
import { IoIosWallet } from "react-icons/io";
import { IoCloseCircle } from "react-icons/io5";
import { PiUserCircleFill } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { getYear, parseISO } from "date-fns";
import { RiRobot2Fill } from "react-icons/ri";
import { TbLogout2 } from "react-icons/tb";
import { formatCurrency } from "../../shared/currency/formatCurrency";
import { GetAccessToken } from "../../shared/token/accessToken";
import { clearUser } from "@/redux/slices/userSlice";
import BottomNav from "./bottomNav";
import { setBalance } from "@/redux/slices/walletSlice";

const Header = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const walletBalance = useSelector((state: RootState) => state.wallet.balance);
    const [isTop, setIsTop] = useState<boolean>(true);
    const [user, setUser] = useState<any>('');
    const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [wallet, setWallet] = useState<any>([]);
    const [accessToken, setAccessToken] = useState<string>('');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const applyTheme = useCallback((newTheme: 'light' | 'dark') => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        setTheme(newTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        const initialTheme = storedTheme === 'dark' ? 'dark' : 'light';
        applyTheme(initialTheme);
        const handleScroll = () => {
            setIsTop(window.scrollY < 650);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [applyTheme]);

    const mainMenu = [
        { icon: <FaUser />, label: "Hồ sơ của bạn", href: "/information" },
        { icon: <IoIosWallet />, label: "Ví AutoBot", href: "/wallet" },
        // { icon: <RiCoupon3Fill />, label: "Hạng thành viên", href: "/membership" },
        { icon: <RiRobot2Fill />, label: "Lịch sử giao dịch", href: "/purchase" },
        { icon: <FaCog />, label: "Cài đặt", href: "/setting" }
    ];

    useEffect(() => {
        if (!userInfo?.Id) return;
        const initializeData = async () => {
            try {
                setIsLoadingUser(true);
                const token = await GetAccessToken(userInfo.Id);

                if (token) {
                    setAccessToken(token);
                    await Promise.all([
                        handleGetUser(token),
                        handleGetWallet(token)
                    ]);
                }
            } catch (err: any) {
            } finally {
                setIsLoadingUser(false);
            }
        };

        initializeData();
    }, [userInfo?.Id]);

    const handleGetUser = async (accessToken: string) => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Authen/GetUserById?userId=${userInfo?.Id}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
            .then(res => {
                setIsLoadingUser(false);
                setUser(res.data.data);
            })
    }

    const handleGetWallet = async (accessToken: string) => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Wallet/GetMoneyInWallet?userId=${userInfo?.Id}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        ).then(res => {
            if (res.data.status === 200) {
                setWallet(res.data.data);
                dispatch(setBalance(res.data.data.balance));
            }
        })
    }

    const handleUserClick = () => {
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleLogout = () => {
        axios.post(`${process.env.NEXT_PUBLIC_URL_API}Device/UserLogout`, {},
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        ).then(res => {
            dispatch(clearUser());
            toast.success("Đăng xuất thành công!");
            setIsOpen(false);
            router.push(`/auth/signin`);
        })
    };

    return (
        <div className="sticky z-90 mx-10 sm:top-0 sm:mx-0 ">
            <div
                className={`w-full h-20 flex items-center laptop:justify-between px-10 top-0 z-50 xs:hidden sm:flex
                dark:bg-[#242933] bg-white dark:text-white text-black`}>

                <div onClick={() => router.push('/')} className="flex items-center cursor-pointer">
                    <Image
                        className="h-[50px] w-[50px]"
                        width={1000}
                        height={500}
                        alt="Logo"
                        src={"/assets/images/logo.png"}
                        loading="lazy"
                    />
                    <div className="text-2xl font-semibold tablet:hidden laptop:block text-black dark:text-white">AutoBot</div>
                </div>

                <div
                    className={`flex items-center gap-10 laptop:text-sm sm:text-[12px] text-black dark:text-white`}>
                    <Link href="/" className="relative group hover:text-blue-400 transition-all duration-100">
                        <span className="inline-block leading-none relative
                                after:content-[''] after:absolute after:left-0 after:-bottom-1
                                after:h-0.5 after:w-0 after:bg-blue-400
                                after:transition-all after:duration-300
                                group-hover:after:w-full">
                            Trang chủ
                        </span>
                    </Link>
                    <Link href="/introduction" className="relative group hover:text-blue-400 transition-all duration-100">
                        <span className="inline-block leading-none relative
                                after:content-[''] after:absolute after:left-0 after:-bottom-1
                                after:h-0.5 after:w-0 after:bg-blue-400
                                after:transition-all after:duration-300
                                group-hover:after:w-full">
                            Giới thiệu
                        </span>
                    </Link>

                    {/* <Link href="/price" className="relative group hover:text-blue-400 transition-all duration-100">
                        <span className="inline-block leading-none relative
                                after:content-[''] after:absolute after:left-0 after:-bottom-1
                                after:h-0.5 after:w-0 after:bg-blue-400
                                after:transition-all after:duration-300
                                group-hover:after:w-full">
                            Bảng giá dịch vụ
                        </span>
                    </Link> */}

                    <Link href="/extension" className="relative group hover:text-blue-400 transition-all duration-100">
                        <span className="inline-block leading-none relative
                                after:content-[''] after:absolute after:left-0 after:-bottom-1
                                after:h-0.5 after:w-0 after:bg-blue-400
                                after:transition-all after:duration-300
                                group-hover:after:w-full">
                            Tải Extension
                        </span>
                    </Link>

                    <label className="theme-switch">
                        <input onChange={toggleTheme} checked={theme === 'dark'} type="checkbox" className="theme-switch__checkbox" />
                        <div className="theme-switch__container">
                            <div className="theme-switch__clouds"></div>
                            <div className="theme-switch__stars-container">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z" fill="currentColor"></path>
                                </svg>
                            </div>
                            <div className="theme-switch__circle-container">
                                <div className="theme-switch__sun-moon-container">
                                    <div className="theme-switch__moon">
                                        <div className="theme-switch__spot"></div>
                                        <div className="theme-switch__spot"></div>
                                        <div className="theme-switch__spot"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </label>
                    <div
                        onClick={handleUserClick}
                        className="relative group flex items-center gap-2 cursor-pointer"
                    >
                        {!userInfo?.Id ? (
                            <>
                                <Link
                                    href="/auth/signin"
                                    className="block py-1 px-5 text-sm font-normal hover:scale-105 bg-blue-400 rounded-3xl text-white transition-all duration-300"
                                >
                                    Tài khoản
                                </Link>
                            </>
                        ) : isLoadingUser ? (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                                <div className="h-4 w-30 bg-gray-300 rounded animate-pulse"></div>
                            </div>
                        ) : user && accessToken ? (
                            <>
                                {user.urlAvatar ? (
                                    <Image
                                        loading="lazy"
                                        width={1000}
                                        height={1000}
                                        src={user.urlAvatar}
                                        alt="User avatar"
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <PiUserCircleFill
                                        className={`text-4xl text-white hover:text-blue-400`}
                                    />
                                )}

                                <span
                                    className={`text-[17px] transition text-black dark:text-white hover:text-[#334eac]`}
                                >
                                    {user.fullName}
                                </span>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/signin"
                                    className="block py-1 px-5 text-sm font-normal hover:scale-105 bg-blue-400 rounded-3xl text-white transition-all duration-300"
                                >
                                    Tài khoản
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <BottomNav />
            <AnimatePresence>
                {isModalOpen && userInfo && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-60 cursor-pointer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={handleCloseModal}
                        />

                        <motion.div
                            className="fixed top-0 right-0 h-full w-84 bg-[#f5f5f5] dark:bg-gray-800 z-70 p-4"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        >
                            <div className="relative">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-200">Xin chào, {user && user.fullName}</div>
                                    <div onClick={handleCloseModal}>
                                        <IoCloseCircle className="text-gray-400 hover:text-gray-500 transition-all duration-300 cursor-pointer dark:text-gray-300 dark:hover:text-white" />
                                    </div>
                                </div>

                                <motion.div
                                    className="absolute z-100 top-10 right-0 w-[400px] h-fit bg-white dark:bg-gray-700 shadow-3xl rounded-2xl"
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ ease: 'easeOut', bounce: .3, duration: 0.4, delay: 0.1 }}
                                >
                                    <div className="p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-lg block">
                                        <div className="flex flex-col justify-center items-center">
                                            {user && (
                                                <Image
                                                    loading="lazy"
                                                    width={120}
                                                    height={120}
                                                    alt="Avatar người dùng"
                                                    src={
                                                        user.urlAvatar ||
                                                        "https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o="
                                                    }
                                                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow"
                                                />
                                            )}

                                            <div className="mt-3 text-xl font-semibold text-gray-800 dark:text-white">
                                                {user?.fullName}
                                            </div>

                                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Thành viên từ{" "}
                                                {user?.createdDate ? getYear(parseISO(user.createdDate)) : "N/A"}
                                            </div>
                                        </div>
                                        <div className="my-6 h-px w-full bg-gray-200 dark:bg-gray-600"></div>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 flex flex-col items-center">
                                                {user && wallet ? (
                                                    <div className="text-xl font-bold text-emerald-600">
                                                        {formatCurrency(walletBalance)}
                                                    </div>
                                                ) : (
                                                    <div className="text-xl font-bold text-emerald-600">
                                                        Chưa kích hoạt
                                                    </div>
                                                )}
                                                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ví AutoBot</div>
                                            </div>
                                            <div className="w-px h-14 bg-gray-300 dark:bg-gray-600 mx-4"></div>
                                            <div className="flex-1 flex flex-col items-center">
                                                <div className="text-xl font-bold text-indigo-600">
                                                    Bạc
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Hội viên</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                            <div className="relative mt-85 pt-4 max-h-screen overflow-y-scroll
                             scrollbar-hide">
                                <div className="">
                                    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 rounded-xl">
                                        {mainMenu.map((item, index) => {
                                            const isLastItem = index === mainMenu.length - 1;
                                            return (
                                                <Link
                                                    key={index}
                                                    href={item.href}
                                                    onClick={() => setIsModalOpen(false)}
                                                    className={`
                flex items-center gap-5 py-3 px-4 font-semibold text-gray-700 dark:text-gray-200
                hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer
                ${index !== 0 ? "border-t border-gray-gray-300 dark:border-gray-600" : "rounded-t-xl"}
                ${isLastItem ? "rounded-b-xl" : ""} // Chỉ thêm bo góc dưới cho phần tử cuối
            `}
                                                >
                                                    {item.icon}
                                                    <div>{item.label}</div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div onClick={() => setIsOpen(true)} className="mt-5 flex items-center justify-center gap-2 py-2 font-semibold bg-blue-400 hover:bg-blue-500 text-white rounded-sm transition-all duration-100 cursor-pointer">
                                    <TbLogout2 />
                                    <div>
                                        Đăng xuất
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-50 z-70"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            className="fixed inset-0 z-70 flex items-center justify-center"
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: "0%", opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl shadow-xl p-6 w-full max-w-md">
                                <h2 className="text-lg font-semibold mb-4">Xác nhận đăng xuất</h2>
                                <p className="mb-6">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        className="px-4 py-2 rounded-md border border-blue-400 cursor-pointer hover:bg-blue-500 hover:text-white transition-all duration-200"
                                        onClick={handleLogout}
                                    >
                                        Đăng xuất
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-md bg-blue-400 hover:bg-blue-500 text-white cursor-pointer transition-all duration-200"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Không
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>

    )
}

export default Header;
