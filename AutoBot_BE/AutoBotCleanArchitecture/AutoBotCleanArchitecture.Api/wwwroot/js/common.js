// ================================================================
// 1. CÁC HÀM TIỆN ÍCH DÙNG CHUNG
// ================================================================
function debounce(func, delay) {
    let timeout;
    return function executedFunc(...args) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
            timeout = null;
        }, delay);
    };
}

function setCookie(cname, cvalue, exMinutes) {
    const d = new Date();
    d.setTime(d.getTime() + (exMinutes * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return null;
}

// ================================================================
// 2. CÁC BIẾN HTML GIAO DIỆN (EXPORT CHO SCRIPT.JS DÙNG)
// ================================================================

const packageHtml = `
    <div id='sat-content'>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-table@1.22.6/dist/bootstrap-table.min.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
        <style>
            .modal-backdrop { z-index: -1; }
            .bot-section .row, .bot-section .col { margin: 0; padding: 0; }
            .text-long, .text-buy { color: #3a9d5d; }
            .btn-long, td.long, td.buy { background: #3a9d5d; }
            .text-short { color: #f63c3a; }
            .btn-short, td.short { background: #f63c3a; }
            td.sell, td.cover { background: #e1c608; }
            #tbl-bot-signals td.long, #tbl-bot-signals td.buy, 
            #tbl-bot-signals td.short, #tbl-bot-signals td.sell, 
            #tbl-bot-signals td.cover { font-weight: bold !important; color: white !important; }
            #tbl-bot-signals span.time { font-size: 0.9rem; }
            #tbl-bot-signals span.price { font-weight: 600; }
            #ulPanel a.nav-link { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            label.form-label { font-size: 0.75rem; margin-bottom: 0; margin-top: 0.5rem; }
            #bot-panel, 
            #bot-signal, 
            #bot-tbl-signals, 
            .bot-signal-refresh { 
                display: none !important; 
            }
        </style>
    </div>
`;

const loginFormHtml = `
<div id='ext-content' class='list-group-item list-group-item-accent-danger m-0 p-1'>
        <div id="bot-account-link" class="text-center py-2">
            <div class="text-center">
                <div id="cb_loginStatus" class="alert alert-info">
                    Đăng nhập để liên kết với Tài khoản với chúng tôi
                </div>
            </div>
            <div class="form-group mb-1">
                <label for="cb_username">Tên đăng nhập</label><br>
                <input id="cb_username" type="text" value="" class="form-control">
            </div>
            <div class="form-group mb-1">
                <label for="cb_password">Mật khẩu</label><br>
                <input id="cb_password" type="password" value="" class="form-control">
            </div>
            <div class="form-group mb-1">
                <input id="cb_showPassword" type="checkbox">
                <label for="cb_showPassword">Hiện mật khẩu</label>
            </div>
            <div class="form-group mb-1">
                <button id="cb_login" type="button" class="btn btn-primary">Đăng nhập</button>
            </div>
            <div class="form-group mb-1">
                <a href="http://localhost:3000/auth/signup" target="_blank" title="Đăng ký tài khoản mới">
                    Chưa có tài khoản? Đăng ký tại đây
                </a>
            </div>
            <div class="form-group mb-1">
                <a href="http://localhost:3000/auth/forgot" target="_blank" title="Quên mật khẩu? Click vào đây">
                    Quên mật khẩu?
                </a>
            </div>
        </div>
     </div>`;

const loggingHtml = `
         <div class="text-left border-bottom mb-2">
             <div class="d-flex">
                 <div class="mr-auto d-flex align-items-center">
                     <i class="fa fa-copy"></i>
                     <a href="https://autobotps.com" target="_blank" class="mx-2" title="Bot phân tán thực hiện bởi Autobotps.com">
                        Autobotps.com
                     </a>
                 </div>
                 <div class="px-2">
                     <a href="javascript:void(0)" class="satbot-logout" title="Đăng xuất">
                         <i class="fa fa-sign-out"></i>
                     </a>
                 </div>
             </div>
         </div>

         <div class="d-none bot-expired alert alert-danger text-center">
             Bot đã hết hạn sử dụng <br> Vui lòng đăng ký lại.
             <br>
             <a href="https://autobotps.com" type="button" class="btn btn-primary">Đăng ký</a>
         </div>

         <div class="text-left border-bottom d-flex">
             <div class="mr-auto">
                 <i class="fa fa-list"></i>
                 Nhật ký hệ thống
             </div>
             <div class="px-2">
                 <a href="javascript:void(0)" title="Xóa nhật ký" class="bot-history-clear">
                     <i class="fa fa-trash"></i>
                 </a>
             </div>
         </div>
         <div class="container-fluid m-0 p-0">
             <textarea id="bot-logs" class="form-controls w-100" rows="10" readonly="" style="font-size: 0.75rem;font-style:italic;border-color:#c8ced3;color:var(--gray-700) !important;"></textarea>
         </div>
    `;

const tabExtContent = `
<div id="tab-ext" class="div-tab tab-pane fade in text-white" role="tabpanel">
    <div id="ext-tab-content">
         <div id="bot-panel" class="container-fluid m-0 p-2 bot-section" style="display: none;"> <div class="d-flex justify-content-between border-bottom">
                 <div class="d-flex align-items-center">
                     <i class="fa fa-list mr-1"></i>
                     <b>Hỗ trợ Đặt lệnh</b>
                 </div>
                 <div class="text-right">
                     <label class="switch switch-label switch-label-panel switch-pill switch-success switch-sm float-right">
                         <input class="switch-input st-bot-config bot-settings" name="bot-auto-order" id="bot-auto-order" type="checkbox">
                         <span class="switch-slider" data-checked="On" data-unchecked="Off" id="bot-auto-order_sl"></span>
                     </label>
                 </div>
             </div>
             <div id="bot-settings-content" class="m-0 p-0">
                 <div class="row my-1 pr-2">
                     <label for="bot-trendTypes">Khi có trend</label>
                     <select id="bot-trendTypes" class="custom-select bot-settings">
                         <option value="0" selected="">LONG hoặc SHORT</option>
                         <option value="1">chỉ LONG</option>
                         <option value="2">chỉ SHORT</option>
                     </select>
                 </div>
                 
                 <div>
                     với Số hợp đồng là
                 </div>
                 <div class="row my-1 pr-2">
                     <div class="col">
                         <select id="bot-volume" class="custom-select bot-settings">
                             <option value="0" selected="">Full Sức mua</option>
                             <option value="1">Số HĐ =</option>
                         </select>
                     </div>
                     <div class="col-4 m-0 p-0 pl-2">
                         <input type="number" class="form-control formatDouble bot-settings" id="bot-volume-value" step="1" min="1" value="" placeholder="Số HĐ">
                     </div>
                 </div>
             </div>
         </div>

         <div id="bot-signal" class="container m-0 p-2" style="display: none;">
             <div class="d-flex justify-content-between text-left border-bottom m-0 p-0">
                 <div class="p-0">
                     <i class="fa fa-list"></i>
                     <b>Tín hiệu Bot</b>
                 </div>
                 <div class="text-right">
                     <a href="javascript:void(0)" class="bot-signal-refresh" title="Click để tải lại">
                         <i class="fa fa-refresh"></i>
                     </a>
                 </div>
             </div>
             <div class="row container-fluid m-0 p-0">
                 <table id="bot-tbl-signals" class="table table-sm">
                     <thead>
                         <tr id="signal-header">
                             <th class="text-left">Ngày</th>
                             <th class="text-left">Thời gian</th>
                             <th class="text-center">Tín hiệu</th>
                             <th class="text-right">Giá</th>
                         </tr>
                     </thead>
                     <tbody>
                     </tbody>
                 </table>
             </div>
         </div>
     </div>
    </div>
</div>`;

const liPanel = `<li class="nav-item text-center">
                        <a class="nav-link tab-copytrade" data-toggle="tab" href="#tab-ext" role="tab" aria-controls="tab-copytrade" aria-selected="false">
                                AUTO BOT
                        </a>
                    </li>`;