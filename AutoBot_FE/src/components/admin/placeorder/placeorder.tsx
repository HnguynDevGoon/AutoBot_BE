'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaRobot, FaHistory, FaInfoCircle, FaBan, FaTimesCircle } from 'react-icons/fa';
import { MdOutlineSecurity, MdTrendingUp } from 'react-icons/md';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { GetAccessToken } from '@/components/shared/token/accessToken';
import * as signalR from '@microsoft/signalr';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

interface SignalData {
    id: string;
    dateTime: string;
    signal: string;
    price: number;
}

const PlaceOrder = () => {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [accessToken, setAccessToken] = useState<string>('');
    const [side, setSide] = useState<'LONG' | 'SHORT' | null>(null);
    const [volume, setVolume] = useState<number>(1);
    const [price, setPrice] = useState<string>('');
    const [stopOrderValue, setStopOrderValue] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [hubStatus, setHubStatus] = useState<'Disconnected' | 'Connecting' | 'Connected'>('Disconnected');
    const [rtMessages, setRtMessages] = useState<{ ts: string; type: 'AdminSignal' | 'Signal'; message: string }[]>([]);
    const [getListSignals, setGetListSignals] = useState<SignalData[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = Number(process.env.NEXT_PUBLIC_PAGE_SIZE || 10);
    const [isReverseMode, setIsReverseMode] = useState<boolean>(false);

    // --- STATE CHO BOT AUTO REVERSE ---
    const [isAutoBot, setIsAutoBot] = useState<boolean>(false);
    const [botVol, setBotVol] = useState<number>(1);
    const [currentViThe, setCurrentViThe] = useState<number>(0); // Giả định lấy từ danh mục

    const pushRt = (type: 'AdminSignal' | 'Signal', message: string) => {
        const ts = new Date().toLocaleString('vi-VN');
        setRtMessages((prev) => [{ ts, type, message }, ...prev].slice(0, 30));
    };

    // Hàm gọi API đặt lệnh
    const adminPost = useCallback(async (payload: { status: string; price: number; orderNumber: number; stopOrderValue: number }) => {
        if (!accessToken) return;
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}admin/signal/add`,
                payload,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
        } catch (e) {
            console.error("Lỗi gửi lệnh:", e);
            throw e;
        }
    }, [accessToken]);

    // --- LOGIC ĐẢO CHIỀU TỰ ĐỘNG (THEO CODE CŨ) ---
    const processAutoBot = useCallback(async (message: string) => {
        if (!isAutoBot) return;

        const msgLower = message.toLowerCase();
        const isLongSignal = msgLower.includes("long");
        const isShortSignal = msgLower.includes("short");
        const isReverseReq = msgLower.includes("reverse");

        if (!isLongSignal && !isShortSignal) return;

        const tinhieu = isLongSignal ? "LONG" : "SHORT";

        // Regex bóc tách giá (Ví dụ: "Gia mua: 1,234.5" hoặc "Gia: 1234.5")
        const priceMatch = message.replace(/,/g, "").match(/(?:gia|mua|ban):\s*([\d.]+)/i);
        const signalPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

        // Regex bóc tách cắt lỗ (SL)
        const slMatch = message.replace(/,/g, "").match(/(?:cat lo|sl):\s*([\d.]+)/i);
        const signalSL = slMatch ? parseFloat(slMatch[1]) : 0;

        let finalVol = botVol;
        const viTheHienTai = currentViThe; // Số lượng vị thế thực tế

        // Logic đảo chiều: (Tín hiệu LONG & đang có vị thế SHORT < 0) hoặc ngược lại
        const logicDaoChieu = isReverseReq && (
            (tinhieu === "LONG" && viTheHienTai < 0) ||
            (tinhieu === "SHORT" && viTheHienTai > 0)
        );

        if (logicDaoChieu) {
            // Lệnh đặt = Vol muốn đánh + Số hợp đồng để bù vị thế cũ về 0
            finalVol = botVol + Math.abs(viTheHienTai);
            pushRt('AdminSignal', `[BOT] Phát hiện đảo chiều. Đặt ${tinhieu} Vol: ${finalVol}`);
        } else {
            // Nếu không đảo chiều mà cùng hướng thì có thể là nhồi lệnh hoặc lệnh mới
            pushRt('AdminSignal', `[BOT] Lệnh mới ${tinhieu} Vol: ${finalVol}`);
        }

        try {
            await adminPost({
                status: tinhieu,
                price: signalPrice,
                orderNumber: finalVol,
                stopOrderValue: signalSL,
            });
            toast.success(`Bot đã tự động đặt lệnh ${tinhieu} ${finalVol} HĐ`);
            // Sau khi đặt thành công, cập nhật vị thế giả định
            setCurrentViThe(tinhieu === "LONG" ? botVol : -botVol);
        } catch (error) {
            toast.error("Bot đặt lệnh tự động thất bại");
        }
    }, [isAutoBot, botVol, currentViThe, adminPost]);

    // Token & SignalR
    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    useEffect(() => {
        if (!accessToken) return;

        const apiBase = (process.env.NEXT_PUBLIC_URL_API || '').replace(/\/+$/, '');
        const derivedHubBase = apiBase.endsWith('/api') ? apiBase.replace(/\/api$/, '') : apiBase.replace(/\/api\/?$/, '');
        const hubBase = (process.env.NEXT_PUBLIC_URL_API_HUB || derivedHubBase).replace(/\/+$/, '');

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${hubBase}/messageHub`, { accessTokenFactory: () => accessToken })
            .withAutomaticReconnect()
            .build();

        connection.on('AdminSignal', (message: string) => pushRt('AdminSignal', message));
        connection.on('Signal', (message: string) => {
            pushRt('Signal', message);
            processAutoBot(message); // Kích hoạt Bot
        });

        connection.onreconnecting(() => setHubStatus('Connecting'));
        connection.onreconnected(() => setHubStatus('Connected'));
        connection.onclose(() => setHubStatus('Disconnected'));

        connection.start()
            .then(() => setHubStatus('Connected'))
            .catch(() => setHubStatus('Disconnected'));

        return () => { connection.stop(); };
    }, [accessToken, processAutoBot]);

    const getListSignal = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}BotSignal/GetSignals`);
            if (response.data.status === 200) setGetListSignals(response.data.data);
        } catch (error) { }
    };

    useEffect(() => {
        getListSignal();
        const interval = setInterval(getListSignal, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCancelAll = async () => {
        const result = await Swal.fire({
            title: 'Hủy tất cả lệnh chờ?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            reverseButtons: true
        });
        if (result.isConfirmed) {
            try {
                setLoading(true);
                await adminPost({ status: 'CANCEL_ALL', price: 0, orderNumber: 0, stopOrderValue: 0 });
                toast.success('Đã gửi lệnh hủy.');
            } catch (e) { toast.error('Lỗi.'); } finally { setLoading(false); }
        }
    };

    const handleClosePosition = async () => {
        const result = await Swal.fire({
            title: 'Đóng vị thế?',
            text: "Đóng toàn bộ vị thế hiện tại!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Xác nhận đóng',
            reverseButtons: true
        });
        if (result.isConfirmed) {
            try {
                setLoading(true);
                await adminPost({ status: 'CANCEL_VITHE', price: 0, orderNumber: 0, stopOrderValue: 0 });
                setCurrentViThe(0);
                toast.success('Đã gửi lệnh đóng vị thế.');
            } catch (e) { toast.error('Lỗi.'); } finally { setLoading(false); }
        }
    };

    const handleSubmitOrder = async () => {
        if (!side) return toast.error('Vui lòng chọn LONG/SHORT');
        const p = parseFloat(price);
        if (isNaN(p) || p <= 0) return toast.error('Giá không hợp lệ');

        try {
            setLoading(true);

            const statusToSend = isReverseMode ? `${side}_REVERSE` : side;
            await adminPost({
                status: statusToSend,
                price: p,
                orderNumber: volume,
                stopOrderValue: stopOrderValue ? parseFloat(stopOrderValue) : 0,
            });

            toast.success(`Đã đặt lệnh ${side} ${isReverseMode ? '(ĐẢO CHIỀU)' : ''}`);

            setIsReverseMode(false);
        } catch (e) {
            toast.error('Thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSignals = getListSignals.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(getListSignals.length / itemsPerPage);

    return (
        <div className="min-h-screen text-slate-800 bg-gray-50/50 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Đặt lệnh</h1>
                        <p className="text-gray-500 text-sm">Quản lý tín hiệu và cấu hình tự động</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleCancelAll} disabled={loading} className="flex items-center gap-2 bg-white border border-orange-200 text-orange-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-all cursor-pointer">
                            <FaBan /> Hủy lệnh
                        </button>
                        <button onClick={handleClosePosition} disabled={loading} className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-all cursor-pointer">
                            <FaTimesCircle /> Đóng vị thế
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <span className="font-semibold text-lg">Lệnh Phái Sinh</span>
                                <div className="flex gap-1 p-1 rounded-xl">
                                    <button onClick={() => setSide('LONG')} className={`px-8 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${side === 'LONG' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>LONG</button>
                                    <button onClick={() => setSide('SHORT')} className={`px-8 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${side === 'SHORT' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>SHORT</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Giá đặt</label>
                                    <input type="number" step="0.1" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="0.0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Số lượng</label>
                                    <div className="flex items-center border rounded-xl overflow-hidden">
                                        <button onClick={() => setVolume(Math.max(1, volume - 1))} className="px-4 py-3 bg-gray-50 border-r">-</button>
                                        <input type="number" value={volume} onChange={(e) => setVolume(parseInt(e.target.value) || 1)} className="w-full text-center font-bold" />
                                        <button onClick={() => setVolume(volume + 1)} className="px-4 py-3 bg-gray-50 border-l">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Cắt lỗ</label>
                                    <input type="number" step="0.1" value={stopOrderValue} onChange={(e) => setStopOrderValue(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-400" placeholder="Tùy chọn" />
                                </div>
                            </div>

                            <button onClick={handleSubmitOrder} disabled={loading} className={`w-full mt-8 py-4 rounded-xl font-black text-white transition-all shadow-lg active:scale-[0.98] cursor-pointer ${side === 'SHORT' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                {side ? `XÁC NHẬN ĐẶT LỆNH ${side}` : 'VUI LÒNG CHỌN CHIỀU'}
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold flex items-center gap-2 mb-4"><FaInfoCircle className="text-blue-500" /> Tín hiệu Robot</h3>
                            <div className="space-y-2">
                                {currentSignals.map((item) => (
                                    <SignalRow key={item.id} action={item.signal} price={item.price} time={item.dateTime.split('T')[1].substring(0, 8)} />
                                ))}
                                <div className="flex justify-center gap-2 mt-4">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border rounded-lg disabled:opacity-30"><ChevronLeft /></button>
                                    <span className="p-2 font-bold">{currentPage} / {totalPages}</span>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border rounded-lg disabled:opacity-30"><ChevronRight /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CÔNG CỤ BOT AUTO */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-blue-50 relative overflow-hidden">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full animate-pulse ${hubStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                Cấu hình Bot Auto
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <span className="text-sm font-bold block">Tự động đảo chiều</span>
                                        <span className="text-[10px] text-gray-400 uppercase">Auto Reverse</span>
                                    </div>
                                    <button
                                        onClick={() => setIsReverseMode(!isReverseMode)}
                                        className={`w-12 h-6 rounded-full transition-all relative cursor-pointer shadow-inner ${isReverseMode ? 'bg-purple-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isReverseMode ? 'right-1' : 'left-1'
                                            }`}></div>
                                    </button>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <label className="text-sm font-bold block mb-2">Số hợp đồng (Bot)</label>
                                    <input type="number" value={botVol} onChange={(e) => setBotVol(parseInt(e.target.value) || 1)} className="w-full p-2 border rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-400 outline-none" />
                                </div>

                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex justify-between text-xs font-bold text-blue-800 uppercase">
                                        <span>Vị thế hiện tại:</span>
                                        <span>{currentViThe > 0 ? `LONG ${currentViThe}` : currentViThe < 0 ? `SHORT ${Math.abs(currentViThe)}` : 'TRỐNG'}</span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Tin nhắn Realtime</p>
                                    <div className="max-h-100 overflow-auto rounded-xl border border-slate-100 bg-white shadow-inner">
                                        {rtMessages.length === 0 ? (
                                            <p className="p-4 text-xs text-gray-400 text-center italic">Đang đợi tín hiệu...</p>
                                        ) : (
                                            rtMessages.map((m, idx) => (
                                                <div key={idx} className="p-3 border-b border-slate-50 last:border-0">
                                                    <div className="flex justify-between mb-1">
                                                        <span className={`text-[10px] font-black ${m.type === 'AdminSignal' ? 'text-purple-600' : 'text-blue-600'}`}>{m.type}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">{m.ts.split(' ')[1]}</span>
                                                    </div>
                                                    <pre className="text-[11px] leading-tight text-slate-700 whitespace-pre-wrap font-sans">{m.message}</pre>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            <FaRobot className="absolute -right-4 -bottom-4 text-blue-500/5 text-8xl rotate-12" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SignalRow = ({ time, action, price }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-slate-50 px-4 rounded-xl transition-all">
        <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700 font-mono">{time}</span>
            <span className="text-[9px] uppercase text-gray-400 font-bold">Giờ</span>
        </div>
        <div className="text-center">
            <div className="text-sm font-bold text-slate-600 font-mono">{price.toLocaleString('vi-VN')}</div>
            <span className="text-[9px] uppercase text-gray-400 font-bold">Mức giá</span>
        </div>
        <div className="text-right">
            <div className={`text-sm font-black italic ${action === 'LONG' ? 'text-green-600' : 'text-red-600'}`}>{action}</div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${action === 'LONG' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{action}</span>
        </div>
    </div>
);

export default PlaceOrder;