// ================================================================
// 1. CẤU HÌNH & TIỆN ÍCH HỆ THỐNG
// ================================================================
const baseURL = "https://x067w4x7-7291.asse.devtunnels.ms"; // Link Dev Tunnel

const api_auth = `${baseURL}/api/Authen`;
const api_signal = `${baseURL}/api/BotSignal`;
const api_logHistory = `${baseURL}/api/LogHistory`;
const api_profitLoss = `${baseURL}/api/ProfitLoss`;
const api_device = `${baseURL}/api/Device`;

const timezone7 = 7 * 60 * 60 * 1000; // ms

const getISOStringNow = () => {
    var time = new Date().getTime() + timezone7;
    return new Date(time).toISOString();
};

const getAccessToken = () => {
    if (typeof getCookie === "function") return getCookie("auth_token");
    return "";
};

// --- [FIX 1] HÀM GIẢI MÃ TOKEN ĐỂ LẤY ID ---
function parseJwt(token) {
    try {
        if (!token) return null;
        var base64Url = token.split(".")[1];
        var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        var jsonPayload = decodeURIComponent(
            window
                .atob(base64)
                .split("")
                .map(function (c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join(""),
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

const getUserIdFromToken = () => {
    const token = getAccessToken();
    if (!token) return null;
    const decoded = parseJwt(token);
    // Lấy trường "Id" đúng như JSON bạn gửi
    if (decoded)
        return decoded.Id || decoded.id || decoded.UserId || decoded.userId;
    return null;
};

const getCurrentUser = () => {
    try {
        const my_user = getCookie("bot_data");
        return my_user ? JSON.parse(my_user) : null;
    } catch (error) {
        return null;
    }
};

// Hàm trích xuất ID an toàn (ưu tiên Token)
const extractUserId = (user) => {
    let uid = getUserIdFromToken();
    if (uid) return uid;
    if (!user) return null;
    return user.userId || user.UserId || user.id || user.Id;
};

const logHistory = (
    userIdInput,
    signal,
    priceBuy,
    profitPointTP,
    numberContract,
    isSL,
) => {
    try {
        // [FIX] Tự động tìm UserId
        let finalUserId =
            userIdInput || getUserIdFromToken() || extractUserId(getCurrentUser());

        if (!finalUserId) {
            console.error("❌ LOG ERROR: Không tìm thấy UserId! Hủy log.");
            return;
        }

        // const isDemo = window.location.href.includes("smarteasy.vps.com.vn")
        // if (!isDemo) {
        const dateTime = getISOStringNow();
        const dataToSend = {
            UserId: finalUserId, // Viết hoa chữ U khớp C#
            Signal: signal,
            ProfitPointTP: profitPointTP,
            PriceBuy: priceBuy,
            NumberContract: numberContract,
            IsSL: isSL,
            DateTime: dateTime,
        };

        const token = getAccessToken();
        $.ajax({
            url: api_logHistory + "/AddLogHistory",
            method: "POST",
            contentType: "application/json",
            headers: { Authorization: "Bearer " + token },
            data: JSON.stringify(dataToSend),
        }).fail((e) => console.error("❌ Lỗi lưu log:", e.responseText));
        // }
    } catch (error) {
        console.log(error);
    }
};

const profitLoss = (userIdInput, price) => {
    try {
        let finalUserId =
            userIdInput || getUserIdFromToken() || extractUserId(getCurrentUser());
        if (!finalUserId) return;

        const isDemo = window.location.href.includes("smarteasy.vps.com.vn");
        if (!isDemo) {
            const date = getISOStringNow();
            const data = JSON.stringify({ UserId: finalUserId, date, price });
            const token = getAccessToken();
            $.ajax({
                url: api_profitLoss + "/CreateProfitLoss",
                method: "POST",
                contentType: "application/json",
                headers: { Authorization: "Bearer " + token },
                data: data,
            });
        }
    } catch (error) {
        console.log(error);
    }
};

// ================================================================
// 3. TIỆN ÍCH GIAO DIỆN
// ================================================================

const add_logs = (text) => {
    var now = new Date();
    text = now.toLocaleTimeString("vi-VN") + ": " + text;
    const bot_logs = $("#bot-logs");
    if (bot_logs.length) {
        !bot_logs.text()
            ? bot_logs.text(text)
            : bot_logs.text(bot_logs.text() + "\n" + text);
        bot_logs.scrollTop(bot_logs[0].scrollHeight);
    }
};

const refresh_page = async () => {
    try {
        const portfolioTab = 'a[href="#taisanAccount"]';
        const giatab = 'a[href="#ngiaIndex"]';
        $(giatab).click();
        await new Promise((r) => setTimeout(r, 200));
        $(portfolioTab).click();
        await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
        add_logs("Làm mới thất bại");
    }
};

const showTinHieu = (tinhieu) => {
    try {
        const date = tinhieu[0].split(" ")[2];
        const time = tinhieu[0].split(" ")[3];
        const signal = tinhieu[1].split(" ")[2].slice(0, -1);
        const price = parseFloat(tinhieu[2].split(":").pop().trim()).toFixed(1);
        const template = `<tr><td class="text-left"><em><span class="date">${date}</span></em></td><td class="text-left"><b><span class="time">${time}</span></b></td><td class="signal text-center ${signal}"><span class="signal">${signal.toUpperCase()}</span></td><td class="text-right"><span class="price">${price}</span></td></tr>`;
        const tbody = $("#bot-tbl-signals tbody");
        if (tbody.length) tbody.prepend(template);
    } catch (error) {
        console.log(error);
    }
};

const getBotSignal = () => {
    try {
        $.ajax({
            url: api_signal + "/GetSignals",
            success: (data) => {
                const tbody = $("#bot-tbl-signals tbody");
                if (!tbody.length) return;
                tbody.empty();
                const list = Array.isArray(data)
                    ? data
                    : data?.data || data?.Data || [];
                if (list.length > 0) {
                    list.map((sig) => {
                        const dt = sig.dateTime || sig.DateTime;
                        const dateObj = dt ? new Date(dt) : null;
                        const date = dateObj ? dateObj.toLocaleDateString("vi-VN") : "";
                        const time = dateObj ? dateObj.toLocaleTimeString("vi-VN") : "";
                        const signal = (sig.signal || sig.Signal || "").toString();
                        const price = sig.price || sig.Price;

                        const template = `<tr><td class="text-left"><em><span class="date">${date}</span></em></td><td class="text-left"><b><span class="time">${time}</span></b></td><td class="signal text-center ${signal.toLowerCase()}"><span class="signal">${signal.toUpperCase()}</span></td><td class="text-right"><span class="price">${price}</span></td></tr>`;
                        tbody.append(template);
                    });
                }
            },
        });
    } catch (error) {
        console.log(error);
    }
};

const my_logout = () => {
    try {
        $.ajax({
            url: api_device + "/UserLogout",
            method: "POST",
            headers: { Authorization: "Bearer " + getAccessToken() },
        }).always(() => {
            setCookie("auth_token", "", -1);
            setCookie("bot_data", "", -1);
            add_logs("Đã đăng xuất");
            window.location.reload();
        });
    } catch (error) {
        console.log(error);
    }
};
const server_logout = () => {
    setCookie("auth_token", "", -1);
    setCookie("bot_data", "", -1);
    window.location.reload();
};

const refreshToken = async () => {
    try {
        const user = getCurrentUser();
        if (!user) return;
        const refresh_token = user.refresh_token;
        const access_token = getAccessToken();
        if (!refresh_token || !access_token) return;
        const data = JSON.stringify({
            accessToken: access_token,
            refreshToken: refresh_token,
        });
        await $.ajax({
            url: api_auth + "/RenewAccessToken",
            method: "POST",
            data: data,
        }).done((res) => {
            const tokenObj = res.data || res.Data || res;
            if (tokenObj?.accessToken)
                setCookie("auth_token", tokenObj.accessToken, 5);
        });
    } catch (error) {
        console.log(error);
    }
};

// Logic Profit & Close (Giữ nguyên logic của bạn)
var checkAdded;
function checkTimeAndAddProfitLoss(userId) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const today = now.toISOString().split("T")[0];
    let str = $("#vmAccInfo").text();
    let num = parseInt(str.replace(/,/g, ""), 10);

    if (hours >= 17) {
        clearInterval(checkAdded);
        return;
    }

    if ((hours > 11 || (hours === 11 && minutes >= 30)) && hours < 13) {
        const morning = getCookie("lastCalledMorning");
        if (morning !== today) {
            profitLoss(userId, num);
            setCookie("lastCalledMorning", today, 1 * 24 * 60);
        }
    } else if ((hours > 14 || (hours === 14 && minutes >= 30)) && hours < 17) {
        const afternoon = getCookie("lastCalledAfternoon");
        if (afternoon !== today) {
            profitLoss(userId, num);
            setCookie("lastCalledAfternoon", today, 1 * 24 * 60);
            clearInterval(checkAdded);
        }
    }
}

let isPositionClosedMorning = false;
let isPositionClosedAfternoon = false;
function checkAndClosePosition() {
    console.log("check đóng vị thế");
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    console.log(hours, minutes);

    const stockCode = $("#right_stock_cd").val();
    const vitheCell = $("#danhmuc_" + stockCode)
        .children("td")
        .eq(1);
    if (!vitheCell || vitheCell.length === 0) return;

    const vithe = vitheCell.html();
    if (!vithe || vithe === "-" || vithe === "undefined") return;

    const soViThe = parseInt(vithe);
    if (isNaN(soViThe) || soViThe === 0) return;

    const lenh = soViThe > 0 ? "SHORT" : "LONG";

    // ===== Đóng phiên sáng: khoảng 11h25 - 11h30 =====
    if (
        hours === 11 &&
        minutes >= 25 &&
        minutes <= 30 &&
        !isPositionClosedMorning
    ) {
        console.log(lenh);
        console.log("Tự động đóng vị thế cuối phiên sáng");
        // Gọi hàm runBotNormal sẽ được define bên dưới, nhưng vì scope nên ta dùng logic click tay ở đây nếu cần,
        // hoặc tốt nhất là để trong scope của loggingAndBot.
        // Tuy nhiên hàm checkAndClosePosition bạn để ngoài scope loggingAndBot nên không gọi được runBotNormal ở đây.
        // Sẽ gọi lại bên trong main load.
    }
    // Logic này sẽ được chạy bên trong main load để gọi được runBotNormal
}
function resetCloseFlagsDaily() {
    const now = new Date();
    if (now.getHours() === 8 && now.getMinutes() === 30) {
        isPositionClosedMorning = false;
        isPositionClosedAfternoon = false;
    }
}

const botSettings = {
    enable: false,
    trendType: "0",
    volume: { type: "0", value: 0 },
};

// ================================================================
// 4. MAIN LOGIC (KẾT NỐI VÀ CHẶN NGƯỜI DÙNG)
// ================================================================
const scripts = [
    "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.1/signalr.min.js",
    `${baseURL}/js/common.js`,
];

function loadScriptAsync(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onload = () => resolve(url);
        script.onerror = () => reject(new Error(`Failed to load script ${url}`));
        document.body.appendChild(script);
    });
}
async function loadScripts(scripts) {
    try {
        await Promise.all(scripts.map(loadScriptAsync));
    } catch (e) {
        console.error(e);
    }
}

window.addEventListener("load", async () => {
    await loadScripts(scripts);
    const isDemo = window.location.href.includes("smarteasy.vps.com.vn");
    $.ajaxSetup({ contentType: "application/json", timeout: 10000 });

    isDemo
        ? $(".btn.btn-block.btn-default.active.btn-cancel-all").addClass(
            "text-white btn-warning",
        )
        : $("#button_cancel_all_order_normal").addClass("text-white bg-warning");

    const web = $("div#orderPS.tab-pane.active");
    if (typeof packageHtml !== "undefined") {
        const root = $(packageHtml);
        web.append(root);
        root.append(loginFormHtml);
    }

    // --- HÀM KHỞI CHẠY BOT (CHỨA TOÀN BỘ LOGIC CỦA BẠN) ---
    async function loggingAndBot(isLogin = false, userId) {
        // [FIX ID] Lấy ID từ Token nếu chưa có
        if (!userId) {
            userId = getUserIdFromToken();
        }
        console.log("🚀 Starting Bot... UserId:", userId);

        let obsNangTP = null;
        let theoDoiTrangThaiDatlenhInterval = null;
        const obsDisconnect = () => {
            if (obsNangTP) {
                obsNangTP.disconnect();
                obsNangTP = null;
            }
            if (theoDoiTrangThaiDatlenhInterval)
                clearInterval(theoDoiTrangThaiDatlenhInterval);
        };

        if (!isDemo) {
            checkTimeAndAddProfitLoss(userId);
            checkAdded = setInterval(() => checkTimeAndAddProfitLoss(userId), 60000);
        }

        // --- ĐƯA LOGIC CHECK CLOSE VÀO ĐÂY ĐỂ GỌI ĐƯỢC RUNBOTNORMAL ---
        setInterval(() => {
            console.log("check đóng vị thế");
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const stockCode = $("#right_stock_cd").val();
            const vitheCell = $("#danhmuc_" + stockCode)
                .children("td")
                .eq(1);
            if (!vitheCell || vitheCell.length === 0) return;

            const vithe = vitheCell.html();
            if (!vithe || vithe === "-" || vithe === "undefined") return;
            const soViThe = parseInt(vithe);
            if (isNaN(soViThe) || soViThe === 0) return;
            const lenh = soViThe > 0 ? "SHORT" : "LONG";

            if (
                hours === 11 &&
                minutes >= 25 &&
                minutes <= 30 &&
                !isPositionClosedMorning
            ) {
                console.log("Tự động đóng vị thế cuối phiên sáng");
                runBotNormal(lenh, "MTL", Math.abs(soViThe));
                isPositionClosedMorning = true;
            }
            if (hours === 14 && minutes >= 44 && !isPositionClosedAfternoon) {
                console.log("Tự động đóng vị thế cuối phiên chieu");
                runBotNormal(lenh, "MTL", Math.abs(soViThe));
                isPositionClosedAfternoon = true;
            }
        }, 60000);

        setInterval(resetCloseFlagsDaily, 60 * 1000);

        const extContent = $("#ext-content");
        if (typeof loggingHtml !== "undefined")
            extContent.children().replaceWith(loggingHtml);
        const ulPanel = $("#ulPanel");
        ulPanel.addClass("flex-nowrap");
        if (typeof liPanel !== "undefined") ulPanel.append(liPanel);
        if (typeof tabExtContent !== "undefined")
            $("#ngiaIndex").after(tabExtContent);

        add_logs("Khởi động hệ thống...");
        $(".bot-history-clear").click(() => $("#bot-logs").text(""));

        if (!isLogin) await refreshToken();
        setInterval(refreshToken, 300000);

        // Binding UI
        const botVolume = $("#bot-volume");
        const botVolumeValue = $("#bot-volume-value");
        const botAutoOrder = $("#bot-auto-order");
        const sucMua = $("#sucmua-int");
        var sohodong = $("#sohopdong");

        // Load Settings
        var settings = () =>
            localStorage.getItem("autoBotSettings") &&
            JSON.parse(localStorage.getItem("autoBotSettings"));
        const st = settings();
        if (st) {
            botAutoOrder.prop("checked", st.enable);
            $("#bot-trendTypes").val(st.trendType);
            botVolume.val(st.volume.type);
            botVolumeValue.val(st.volume.value);
        } else {
            botVolumeValue.val(parseInt(sucMua.text()) || 1);
            botAutoOrder.prop("checked", false);
        }

        // --- UI EVENTS ---
        botVolume.change(function () {
            if ($(this).val() === "0") {
                botVolumeValue.val(parseInt(sucMua.text()));
                if (botAutoOrder.is(":checked")) sohodong.val(botVolumeValue.val());
            }
        });
        botVolumeValue.on("input", function () {
            let value = $(this).val();
            const max = parseInt($(this).attr("max"));
            if (value > max) $(this).val(max);
            botVolume.val("1");
            if (botAutoOrder.is(":checked")) sohodong.val($(this).val());
            add_logs(botVolume.find(":selected").text() + " " + $(this).val());
            localStorage.setItem(
                "autoBotSettings",
                JSON.stringify({
                    ...(settings() ?? botSettings),
                    volume: { type: botVolume.val(), value: $(this).val() },
                }),
            );
        });
        if (botAutoOrder.is(":checked")) sohodong.val(botVolumeValue.val());

        botAutoOrder.on("change", function () {
            if ($(this).is(":checked")) {
                sohodong.val(botVolumeValue.val());
                add_logs("Đã bật bot hỗ trợ đặt lệnh");
            } else {
                sohodong.val(1);
                obsDisconnect();
                add_logs("Đã tắt bot hỗ trợ đặt lệnh");
            }
            localStorage.setItem(
                "autoBotSettings",
                JSON.stringify({
                    ...(settings() ?? botSettings),
                    enable: $(this).is(":checked"),
                }),
            );
        });
        $("#bot-trendTypes").on("change", function () {
            add_logs("Khi có trend " + $(this).find(":selected").text());
            localStorage.setItem(
                "autoBotSettings",
                JSON.stringify({
                    ...(settings() ?? botSettings),
                    trendType: $(this).val(),
                }),
            );
        });
        botVolume.on("change", function () {
            add_logs($(this).find(":selected").text() + " " + botVolumeValue.val());
            localStorage.setItem(
                "autoBotSettings",
                JSON.stringify({
                    ...(settings() ?? botSettings),
                    volume: { type: $(this).val(), value: botVolumeValue.val() },
                }),
            );
        });

        getBotSignal();
        const debouncedGetBotSignal = debounce(() => {
            $("#bot-tbl-signals tbody").empty();
            getBotSignal();
        }, 500);
        $(".bot-signal-refresh").click(debouncedGetBotSignal);
        $(".satbot-logout").click(() => {
            if (confirm("Bạn muốn đăng xuất khỏi hệ thống auto?")) my_logout();
        });

        let giabandau = 0;
        const handleOrderClick = () => {
            if (theoDoiTrangThaiDatlenhInterval || obsNangTP) {
                const th = $("#modal_order_type").text();
                const shd = $("#modal_sohopdong").text();
                const gd = $("#modal_price").text();
                obsDisconnect();
                logHistory(userId, th + " - Lệnh tay", gd, 0, shd, false);
            }
        };
        isDemo
            ? $("#acceptCreateOrder").click(handleOrderClick)
            : $("#acceptCreateOrderNew").click(handleOrderClick);

        let maxHD = sucMua.text();
        const svt = parseInt(
            $("#danhmuc_" + $("#right_stock_cd").val())
                .children("td")
                .eq(1)
                .html(),
        );
        if (svt) maxHD += svt;
        botVolumeValue.attr("max", maxHD);

        const funcTheoDoiSucMua = () => {
            const sucmua = document.getElementById("sucmua-int");
            if (!sucmua) {
                setTimeout(funcTheoDoiSucMua, 1000);
            } else {
                const observer = new MutationObserver(function (mutationsList) {
                    for (let mutation of mutationsList) {
                        if (
                            mutation.type === "characterData" ||
                            mutation.type === "childList"
                        ) {
                            const newValue = parseInt(mutation.target.textContent);
                            if (newValue < 0) newValue = 0;
                            if (botVolume.val() === "0") {
                                botVolumeValue.val(newValue);
                                localStorage.setItem(
                                    "autoBotSettings",
                                    JSON.stringify({
                                        ...(settings() ?? botSettings),
                                        volume: {
                                            type: botVolume.val(),
                                            value: botVolumeValue.val(),
                                        },
                                    }),
                                );
                            }
                        }
                    }
                });
                observer.observe(sucmua, {
                    characterData: true,
                    childList: true,
                    subtree: true,
                });
            }
        };
        funcTheoDoiSucMua();

        // Helper functions
        const convertFloatToFixed = (v, fix = 1) => {
            const numberString = v.split(":").pop().trim();
            const number = parseFloat(numberString).toFixed(fix);
            return parseFloat(number);
        };
        const divideNumberBy2CeilToArray = (v) => {
            let a = Math.ceil(parseInt(v) / 2);
            let b = v - a;
            return [a, b];
        };

        // --- CÁC HÀM THỰC THI LỆNH (FULL LOGIC CỦA BẠN) ---
        const runBotNormal = (tinhieu, giadat, hopdong) => {
            $(".cancel-all-confirm").css("display", "");
            $("#use_stopOrder").prop("checked", false);
            $("#modal_price").text(giadat);
            objConfig.CONFIRM_ORDER = false;
            $("#right_price").val(giadat);
            $("#sohopdong").val(hopdong);
            tinhieu === "LONG"
                ? $('input[name="type"]').val("B")
                : $('input[name="type"]').val("S");
            isDemo ? saveOrder() : saveOrderNew();

            add_logs(`Đã đặt lệnh ${tinhieu} giá ${giadat} với ${hopdong} hợp đồng`);
            // [FIX] Gọi LogHistory (Truyền 0 cho các giá trị chưa có)
            logHistory(userId, tinhieu, parseFloat(giadat), 0, hopdong, false);
        };

        const runBotStopOrder = (tinhieu, hopdong, stopOrderValue) => {
            $("#right_price").val("MTL");
            $("#sohopdong").val(hopdong);
            tinhieu === "LONG"
                ? $('input[name="type"]').val("B")
                : $('input[name="type"]').val("S");
            $(".cancel-all-confirm").css("display", "");

            if (isDemo) {
                plusDivs(1);
                $("#use_stopOrder").prop("checked", true);
                tinhieu === "LONG"
                    ? $("#selStopOrderType").val("SOL")
                    : $("#selStopOrderType").val("SOU");
                $("#soIndex").val(stopOrderValue);
                saveOrder();
                plusDivs(-1);
                $("#use_stopOrder").prop("checked", false);
            } else {
                changeSelectionType($("#select_condition_order_wrapper"));
                changeSelectOrder($("#select_order_type").children().eq(1)[0]);
                $("#modal_price").text("MTL");
                objConfig.CONFIRM_ORDER = false;
                $("#right_order_type").data("2");
                $("#right_stock_cd_code").data("3");
                tinhieu === "LONG"
                    ? $("#right_selStopOrderType").val("SOL")
                    : $("#right_selStopOrderType").val("SOU");
                $("#right_stopOrderIndex").val(stopOrderValue);
                saveOrderNew();
                changeSelectionType($("#select_normal_order_wrapper"));
            }
            add_logs(
                `Đã đặt lệnh ${tinhieu} Stop Order: ${stopOrderValue}, MTL với ${hopdong} hợp đồng`,
            );
            localStorage.removeItem("lastTP");
        };

        const huyLenhThuong = () => {
            $(".cancel-all-confirm").css("display", "none");
            isDemo ? saveOrder() : saveOrderNew();
            $(".cancel-all-confirm").css("display", "");
            add_logs("Đã hủy tất cả lệnh thường");
        };

        const huyLenhDieuKien = () => {
            if (isDemo) {
                objOrderPanel.screen = "advance";
                objOrderPanel.create = 0;
                objOrderPanel.showConditionOrderList();
                setTimeout(() => {
                    $("#tbodyContentCondition tr").each(function () {
                        const link = $(this).find('a[id^="btne_"]');
                        if (link.length > 0) {
                            const orderNo = $(this).children().eq(0).attr("id").split("_")[1];
                            $("#order_del_no_conf").val(orderNo);
                            cancelOrder("advance");
                        }
                    });
                }, 700);
            } else {
                $("#modal_stock_cd_cancel_all").val("ALL");
                $("#modal_account_cancel_all").val(
                    $("#right_account option:selected").val(),
                );
                $("#cancel_order_type").val("order_condition");
                cancelAllOrderPending();
            }
            add_logs("Đã hủy tất cả lệnh điều kiện chờ kích hoạt");
        };

        const huyViTheHienTai = () => {
            huyLenhThuong();
            huyLenhDieuKien();
            let vithe = $("#danhmuc_" + $("#right_stock_cd").val())
                .children("td")
                .eq(1)
                .html();
            if (vithe != "undefined" && typeof vithe != "undefined" && vithe != "-") {
                let soVithe = parseInt(vithe);
                const lenh = soVithe > 0 ? "SHORT" : "LONG";
                runBotNormal(lenh, "MTL", Math.abs(soVithe));
            } else add_logs("Chưa có vị thế");
        };

        const daoLenh = (tinhieu) => (tinhieu === "LONG" ? "SHORT" : "LONG");
        const capNhatDanhSachLenh = () => {
            objOrderPanel.screen = "order";
            objOrderPanel.create = 0;
            $("#hdnPageCurrentIntime").val(1);
            $("input[name=statusFilter]:checked").val("");
            objOrderPanel.showOrderList();
        };
        const parseStrToFloat = (str) => parseFloat(str.replace(/,/g, ""));

        // --- [QUAN TRỌNG] LOGIC BOT AUTO CLICK ĐẦY ĐỦ CỦA BẠN Ở ĐÂY ---
        const botAutoClick = async (
            arr,
            fullHopdong = parseInt(botVolumeValue.val()),
            isAdmin = false,
        ) => {
            refresh_page();
            let tinhieu = arr[1] == "Tin hieu long: Manh" ? "LONG" : "SHORT";
            add_logs("Tín hiệu: " + tinhieu);
            obsDisconnect();

            let dadatTp1 = false;
            let dadatTp2 = false;
            let daHuyInitCancel = false;
            let daHuyTp1Cancel = false;

            const type = arr[arr.length - 1].split(" ");
            const daGuiReverse =
                arr.some((l) => l.startsWith("REVERSE")) ||
                arr[arr.length - 1] === "REVERSE" ||
                type[0] === "REVERSE";
            const soViThe = parseInt(
                $("#danhmuc_" + $("#right_stock_cd").val())
                    .children("td")
                    .eq(1)
                    .html(),
            );

            const daoChieu =
                daGuiReverse &&
                ((tinhieu === "LONG" && soViThe < 0) ||
                    (tinhieu === "SHORT" && soViThe > 0));
            const isLong = tinhieu === "LONG";
            let my_hd = fullHopdong;
            const ngDat = parseInt(botVolumeValue.val());
            const soSucMua = parseInt(sucMua.text());

            if (daoChieu) {
                add_logs("Tín hiệu đảo chiều!");
                if (botVolume.val() === "0") {
                    if (soViThe && !soSucMua) {
                        if (isAdmin) {
                            Math.abs(soViThe) >= fullHopdong
                                ? (fullHopdong += Math.abs(soViThe))
                                : ((my_hd = Math.abs(soViThe)),
                                    (fullHopdong = Math.abs(soViThe) * 2));
                        } else {
                            add_logs("Đảo chiều khi để full sức mua và không có sức mua");
                            my_hd = Math.abs(soViThe);
                            fullHopdong = Math.abs(soViThe) * 2;
                            add_logs(`my_hd: ${my_hd}, fullHopdong: ${fullHopdong}`);
                            isLong
                                ? add_logs("đảo short sang long")
                                : add_logs("đảo long sang short");
                        }
                    } else if (!soViThe && soSucMua) {
                        if (isAdmin) {
                            fullHopdong > ngDat
                                ? ((my_hd = ngDat), (fullHopdong = ngDat))
                                : ((my_hd = ngDat), (fullHopdong = ngDat));
                        } else {
                            add_logs(
                                "Đảo chiều khi để full sức mua, không vị thế , có sức mua",
                            );
                            my_hd = ngDat;
                            fullHopdong = ngDat;
                        }
                    } else if (soViThe && soSucMua) {
                        if (isAdmin) {
                            Math.abs(soViThe) + ngDat < fullHopdong
                                ? ((my_hd = Math.abs(soViThe) + ngDat),
                                    (fullHopdong = Math.abs(soViThe) * 2 + ngDat))
                                : ((my_hd = fullHopdong), (fullHopdong += Math.abs(soViThe)));
                        } else {
                            add_logs("Đảo chiều khi để full sức mua, có vị thế , có sức mua");
                            my_hd = Math.abs(soViThe) + ngDat;
                            fullHopdong = Math.abs(soViThe) * 2 + ngDat;
                        }
                    }
                } else {
                    if (soViThe && !soSucMua) {
                        if (isAdmin) {
                            Math.abs(soViThe) >= fullHopdong
                                ? (fullHopdong += Math.abs(soViThe))
                                : ((my_hd = Math.abs(soViThe)),
                                    (fullHopdong = Math.abs(soViThe) * 2));
                        } else {
                            add_logs("Đảo chiều khi set volume và không có sức mua ");
                            my_hd = Math.abs(soViThe);
                            fullHopdong += Math.abs(soViThe);
                        }
                    } else if (!soViThe && soSucMua) {
                        if (isAdmin) {
                            fullHopdong > ngDat
                                ? ((my_hd = ngDat), (fullHopdong = ngDat))
                                : ((my_hd = ngDat), (fullHopdong = ngDat));
                        } else {
                            my_hd = ngDat;
                            fullHopdong = ngDat;
                        }
                    } else if (soViThe && soSucMua) {
                        if (isAdmin) {
                            fullHopdong > ngDat
                                ? ((my_hd = ngDat), (fullHopdong = ngDat + Math.abs(soViThe)))
                                : (fullHopdong += Math.abs(soViThe));
                        } else {
                            my_hd = ngDat;
                            fullHopdong = ngDat + Math.abs(soViThe);
                        }
                    }
                }
                huyLenhThuong();
                huyLenhDieuKien();
                add_logs("Hủy lệnh sau đảo chiều");
            } else {
                if (soViThe) {
                    if (isAdmin) {
                        fullHopdong > ngDat
                            ? ((my_hd = ngDat + Math.abs(soViThe)), (fullHopdong = ngDat))
                            : (my_hd += Math.abs(soViThe));
                    } else {
                        const lastTP = JSON.parse(localStorage.getItem("lastTP"));
                        if (lastTP) {
                            add_logs(
                                `Lệnh trước đã TP ${lastTP.level} tại giá ${lastTP.price}, SL: ${lastTP.contracts} hợp đồng lúc ${lastTP.time}`,
                            );
                            add_logs(`Thực hiện nhồi lệnh`);
                            if (lastTP.level === "TP1") {
                                my_hd = ngDat;
                                fullHopdong = Math.ceil(ngDat * 0.5);
                            } else if (lastTP.level === "TP2") {
                                my_hd = ngDat;
                                fullHopdong = Math.ceil(ngDat * 0.75);
                            }
                        } else {
                            my_hd = ngDat + Math.abs(soViThe);
                            fullHopdong = ngDat;
                        }
                    }
                } else {
                    if (isAdmin) {
                        fullHopdong > ngDat
                            ? ((my_hd = ngDat), (fullHopdong = ngDat))
                            : ((my_hd = ngDat), (fullHopdong = ngDat));
                    } else {
                        my_hd = ngDat;
                        fullHopdong = ngDat;
                    }
                }
            }

            let giamua = convertFloatToFixed(arr[2]);
            let catLo = convertFloatToFixed(arr[7]);
            if (!isAdmin) {
                tinhieu === "LONG" ? (giamua += 0.5) : (giamua -= 0.5);
                giamua = parseFloat(giamua.toFixed(1));
            }

            const tp1 = convertFloatToFixed(arr[3]);
            const tp2 = convertFloatToFixed(arr[4]);
            const order50 = divideNumberBy2CeilToArray(my_hd);
            const order25 = divideNumberBy2CeilToArray(order50[1]);
            const trendType = $("#bot-trendTypes").val();

            if (
                ((trendType == "1" && tinhieu == "LONG") ||
                    (trendType == "2" && tinhieu == "SHORT") ||
                    trendType == "0") &&
                fullHopdong > 0
            ) {
                runBotNormal(tinhieu, giamua, fullHopdong);

                const funcNangTP = () => {
                    localStorage.removeItem("lastTP");
                    // [FIX] GỌI LOG HISTORY CHUẨN ID
                    logHistory(userId, tinhieu, giamua, giamua, fullHopdong, false);
                    giabandau = giamua;
                    const tinHieuDao = daoLenh(tinhieu);
                    runBotStopOrder(tinHieuDao, my_hd, catLo);

                    if (order50[0] > 0) runBotNormal(tinHieuDao, tp1, order50[0]);
                    if (order25[0] > 0) runBotNormal(tinHieuDao, tp2, order25[0]);

                    const funcTheoDoiGiaKhopLenh = () => {
                        const r = $("#right_stock_cd").val() + "row";
                        const nodeGiaKhop = document.getElementById(r)?.children[10];
                        if (!nodeGiaKhop) {
                            setTimeout(funcTheoDoiGiaKhopLenh, 1000);
                        } else {
                            obsNangTP = new MutationObserver(function (mutationsList) {
                                for (let mutation of mutationsList) {
                                    if (
                                        mutation.type === "characterData" ||
                                        mutation.type === "childList"
                                    ) {
                                        const giaKhopLenh = parseStrToFloat(
                                            mutation.target.textContent,
                                        );
                                        if (isNaN(giaKhopLenh)) continue;
                                        const isShort = tinhieu === "SHORT";
                                        const condition1 = isShort
                                            ? giaKhopLenh <= tp1 && giaKhopLenh > tp2
                                            : giaKhopLenh >= tp1 && giaKhopLenh < tp2;
                                        const condition2 = isShort
                                            ? giaKhopLenh <= tp2
                                            : giaKhopLenh >= tp2;
                                        const shdTP1 = my_hd - parseInt(order50[0]);
                                        const shdTP2 =
                                            my_hd - parseInt(order50[0]) - parseInt(order25[0]);

                                        if (condition1 && !dadatTp1 && shdTP1 > 0) {
                                            huyLenhDieuKien();
                                            add_logs("Hủy lệnh sau khi chot tp1");
                                            isDemo
                                                ? setTimeout(
                                                    () => runBotStopOrder(tinHieuDao, shdTP1, giamua),
                                                    1000,
                                                )
                                                : runBotStopOrder(tinHieuDao, shdTP1, giamua);
                                            dadatTp1 = true;
                                            localStorage.setItem(
                                                "lastTP",
                                                JSON.stringify({
                                                    level: "TP1",
                                                    time: new Date().toISOString(),
                                                    price: tp1,
                                                    contracts: shdTP1,
                                                }),
                                            );
                                            logHistory(userId, tinhieu, giamua, tp1, shdTP1, false);
                                            giabandau = tp1;
                                        } else if (condition2 && !dadatTp2 && shdTP2 > 0) {
                                            huyLenhDieuKien();
                                            add_logs("Hủy lệnh sau khi chot tp2");
                                            isDemo
                                                ? setTimeout(
                                                    () => runBotStopOrder(tinHieuDao, shdTP2, tp1),
                                                    1000,
                                                )
                                                : runBotStopOrder(tinHieuDao, shdTP2, tp1);
                                            dadatTp1 = true;
                                            dadatTp2 = true;
                                            localStorage.setItem(
                                                "lastTP",
                                                JSON.stringify({
                                                    level: "TP2",
                                                    time: new Date().toISOString(),
                                                    price: tp2,
                                                    contracts: shdTP2,
                                                }),
                                            );
                                            logHistory(userId, tinhieu, tp1, tp2, shdTP2, false);
                                            giabandau = tp2;
                                        }

                                        const initCancelCondition = isShort
                                            ? giaKhopLenh >= catLo && !dadatTp1 && !dadatTp2
                                            : giaKhopLenh <= catLo && !dadatTp1 && !dadatTp2;
                                        const tp1Condition = isShort
                                            ? giaKhopLenh >= giamua && dadatTp1 && !dadatTp2
                                            : giaKhopLenh <= giamua && dadatTp1 && !dadatTp2;

                                        if (initCancelCondition && !daHuyInitCancel) {
                                            huyLenhThuong();
                                            add_logs("Hủy lệnh sau khi cắt lỗ");
                                            daHuyInitCancel = true;
                                            logHistory(userId, tinhieu, giamua, catLo, my_hd, true);
                                        } else if (tp1Condition && !daHuyTp1Cancel) {
                                            huyLenhThuong();
                                            add_logs("Hủy lệnh sau khi ?");
                                            daHuyInitCancel = true;
                                            daHuyTp1Cancel = true;
                                            logHistory(userId, tinhieu, giamua, tp1, shdTP1, true);
                                        }
                                    }
                                }
                            });
                            obsNangTP.observe(nodeGiaKhop, {
                                characterData: true,
                                childList: true,
                                subtree: true,
                            });
                        }
                    };
                    funcTheoDoiGiaKhopLenh();
                };

                const funcTheoDoiTrangThaiDat = () => {
                    let lenhFullHd;
                    isDemo
                        ? (lenhFullHd =
                            document.getElementById("tbodyContent")?.children[0]
                                ?.children[9])
                        : (lenhFullHd =
                            document.getElementById("tbodyContent")?.children[0]
                                ?.children[10]);

                    if (!lenhFullHd) {
                        setTimeout(funcTheoDoiTrangThaiDat, 1000);
                    } else {
                        const trangthaiBanDau = lenhFullHd.textContent.trim();
                        if (trangthaiBanDau == "Đã khớp") {
                            funcNangTP();
                            if (theoDoiTrangThaiDatlenhInterval)
                                clearInterval(theoDoiTrangThaiDatlenhInterval);
                        } else {
                            const huyLenhSau90s = setTimeout(() => {
                                let nodeTrangThai;
                                isDemo
                                    ? (nodeTrangThai =
                                        document.getElementById("tbodyContent")?.children[0]
                                            ?.children[9])
                                    : (nodeTrangThai =
                                        document.getElementById("tbodyContent")?.children[0]
                                            ?.children[10]);
                                if (!nodeTrangThai) return;
                                const trangthai = nodeTrangThai.textContent.trim();
                                if (theoDoiTrangThaiDatlenhInterval)
                                    clearInterval(theoDoiTrangThaiDatlenhInterval);
                                if (trangthai == "Chờ khớp") {
                                    add_logs("Trạng thái lệnh: " + trangthai);
                                    huyLenhThuong();
                                    add_logs("Hủy lệnh sau khi het timeout");
                                }
                            }, 90000);

                            capNhatDanhSachLenh();
                            theoDoiTrangThaiDatlenhInterval = setInterval(() => {
                                let nodeTrangThai;
                                isDemo
                                    ? (nodeTrangThai =
                                        document.getElementById("tbodyContent")?.children[0]
                                            ?.children[9])
                                    : (nodeTrangThai =
                                        document.getElementById("tbodyContent")?.children[0]
                                            ?.children[10]);
                                if (!nodeTrangThai) return;
                                const trangthai = nodeTrangThai.textContent.trim();
                                if (trangthai == "Đã khớp") {
                                    funcNangTP();
                                    if (huyLenhSau90s) clearTimeout(huyLenhSau90s);
                                    if (theoDoiTrangThaiDatlenhInterval)
                                        clearInterval(theoDoiTrangThaiDatlenhInterval);
                                } else capNhatDanhSachLenh();
                            }, 1500);
                        }
                    }
                };
                setTimeout(capNhatDanhSachLenh, 500);
                setTimeout(funcTheoDoiTrangThaiDat, 2000);
            }
        };

        // =========================================================
        // SIGNALR (CHẶN NGƯỜI DÙNG Ở ĐÂY)
        // =========================================================
        var connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseURL}/messageHub`, {
                accessTokenFactory: () => getAccessToken(),
            })
            .withAutomaticReconnect()
            .build();

        // 1. Nhận lệnh (Chỉ user VIP mới nhận được cái này nếu Backend sửa đúng)
        connection.on("Signal", function (message) {
            const tinhieu = message.split("\n").map((line) => line.trim());
            showTinHieu(tinhieu);
            // Chỉ cho chạy nếu nút BẬT và KHÔNG BỊ KHÓA
            if (botAutoOrder.is(":checked") && !botAutoOrder.is(":disabled")) {
                botAutoClick(tinhieu);
            }
        });

        connection.on("ServerMessage", function (message) {
            console.log("📩 Server Message:", message);

            if (message === "LOGOUT") {
                obsDisconnect();
                connection.stop();
                add_logs(
                    "Tài khoản đã đăng nhập từ trình duyệt khác, bạn sẽ bị đăng xuất.",
                );
                setTimeout(server_logout, 1000);
            }
            // [FIX] XỬ LÝ HẾT HẠN (Chặn người dùng)
            else if (message === "EXPIRED") {
                add_logs("⛔ GÓI BOT ĐÃ HẾT HẠN! Vui lòng gia hạn.");
                const btnBot = $("#bot-auto-order");
                btnBot.prop("checked", false);
                btnBot.attr("disabled", true);

                $("#bot-tbl-signals").attr("style", "display: none !important");

                $("#bot-panel h4")
                    .css("background", "#dc3545")
                    .css("color", "white")
                    .text("⛔ BOT HẾT HẠN");

                let currentSet = settings() || botSettings;
                currentSet.enable = false;
                localStorage.setItem("autoBotSettings", JSON.stringify(currentSet));
            }
            // [FIX] XỬ LÝ VIP
            else if (message === "VIP_USERS") {
                add_logs("Đã kết nối với tín hiệu bot");
                add_logs("Hệ thống sẵn sàng");

                $("#bot-panel").attr("style", "display: block !important");
                $("#bot-signal").attr("style", "display: block !important");
                $("#bot-tbl-signals").attr("style", "display: table !important");
                $(".bot-signal-refresh").attr("style", "display: inline-block !important");

                $("#bot-panel h4")
                    .css("background", "#28a745")
                    .css("color", "white")
                    .text("🤖 BOT VIP");

                const btnBot = $("#bot-auto-order");
                btnBot.attr("disabled", false);

                btnBot.prop("checked", true);

                let currentSet = settings() || botSettings;
                currentSet.enable = true;
                localStorage.setItem("autoBotSettings", JSON.stringify(currentSet));
            }
        });

        connection.on("AdminSignal", function (message) {
            if (botAutoOrder.is(":checked") && !botAutoOrder.is(":disabled")) {
                if (message == "CANCEL_ALL") {
                    add_logs("Admin: Hủy tất cả lệnh");
                    huyLenhThuong();
                    huyLenhDieuKien();
                    obsDisconnect();
                } else if (message == "CANCEL_VITHE") {
                    add_logs("Admin: Hủy vị thế hiện tại");
                    huyViTheHienTai();
                    obsDisconnect();
                } else if (message.includes("STOP_ORDER_ONLY")) {
                    const arr = message.split("\n").map((line) => line.trim());
                    const tinhieu = arr[1].toUpperCase();
                    let sohd = parseInt(arr[2]);
                    const sl = parseFloat(parseFloat(arr[3]).toFixed(1));
                    if (sohd > botVolumeValue.val()) sohd = botVolumeValue.val();
                    if (sohd > 0) runBotStopOrder(tinhieu, sohd, sl);
                    else add_logs("Số hợp đồng phải lớn hơn 0");
                } else {
                    const arr = message.split("\n").map((line) => line.trim());
                    showTinHieu(arr);
                    const type = arr[arr.length - 1].split(" ");
                    let hopdong = botVolumeValue.val();
                    if (
                        (type[1] || type[2]) &&
                        (parseInt(type[1]) > 0 || parseInt(type[2]) > 0)
                    )
                        hopdong = parseInt(type[1]) || parseInt(type[2]);
                    if (type[0] === "NO_STOP_ORDER" || type[1] === "NO_STOP_ORDER") {
                        const tinhieu = arr[1] === "Tin hieu long: Manh" ? "LONG" : "SHORT";
                        let giamua = convertFloatToFixed(arr[2]);
                        if (hopdong > botVolumeValue.val()) hopdong = botVolumeValue.val();
                        if (hopdong > 0) runBotNormal(tinhieu, giamua, hopdong);
                        else add_logs("Số hợp đồng phải lớn hơn 0");
                    } else {
                        botAutoClick(arr, hopdong, true);
                    }
                }
            }
        });


        connection.start()
            .then(() => {
            })
            .catch((err) => {
                add_logs("❌ Lỗi kết nối máy chủ");
            });
    }

    // Init
    const token = getAccessToken();
    if (token) {
        // [FIX] Giải mã token để lấy ID ngay khi load trang
        const uid = getUserIdFromToken();
        loggingAndBot(false, uid);
    } else {
        $("#cb_showPassword").on("change", function () {
            const showPassword = $(this).is(":checked");
            $("#cb_password").attr("type", showPassword ? "text" : "password");
        });
        $("#cb_login").click(function () {
            const $statusElement = $("#cb_loginStatus");
            try {
                $statusElement.text("").removeClass("alert-danger alert-info");
                const username = $("#cb_username").val();
                const password = $("#cb_password").val();
                if (!username || !password)
                    throw new Error("Vui lòng nhập đủ thông tin");

                $statusElement
                    .removeClass("alert-danger")
                    .addClass("alert-info")
                    .text("Đang đăng nhập...");
                $(this).attr("disabled", true);

                const data = JSON.stringify({
                    loginIdentifier: username,
                    password: password,
                    fingerprint: "browser-ext-test",
                });

                $.ajax({ url: api_auth + "/UserLogin", method: "POST", data: data })
                    .done((res) => {
                        const tokenData = res.data || res.Data || {};
                        const accessToken = tokenData.accessToken || tokenData.AccessToken;

                        if (accessToken) {
                            setCookie("auth_token", accessToken, 5);
                            let saveData = { ...tokenData };
                            delete saveData.accessToken;
                            delete saveData.refreshToken;
                            setCookie("bot_data", JSON.stringify(saveData), 1 * 24 * 60);

                            // [FIX] Gọi loggingAndBot với ID lấy từ token mới
                            const userId = getUserIdFromToken();
                            loggingAndBot(true, userId);
                        } else {
                            const msg =
                                res.message ||
                                res.Message ||
                                "Đăng nhập thất bại (Không tìm thấy token)";
                            $("#cb_loginStatus").text(msg).addClass("alert-danger");
                            $("#cb_login").attr("disabled", false);
                        }
                    })
                    .fail((e) => {
                        $("#cb_loginStatus")
                            .text(e.responseJSON?.message || "Lỗi")
                            .addClass("alert-danger");
                        $("#cb_login").attr("disabled", false);
                    });
            } catch (error) {
                $("#cb_loginStatus").text(error.message).addClass("alert-danger");
                $(this).attr("disabled", false);
            }
        });
    }
});
