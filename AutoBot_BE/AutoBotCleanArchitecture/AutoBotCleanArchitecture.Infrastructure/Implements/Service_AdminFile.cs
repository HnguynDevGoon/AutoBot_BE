using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.AdminFile;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Infrastructure.Hubs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Globalization;
using System.IO;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Services
{
    public class Service_AdminFile : IService_AdminFile
    {
        private readonly IService_BotSignal _botSignalService;
        private readonly IHubContext<MessageHub> _hubContext;
        private readonly IWebHostEnvironment _env;
        private readonly ResponseObject<string> _response; 

        private readonly CultureInfo _culture;

        public Service_AdminFile(
            IService_BotSignal botSignalService,
            IHubContext<MessageHub> hubContext,
            IWebHostEnvironment env,
            ResponseObject<string> response) 
        {
            _botSignalService = botSignalService;
            _hubContext = hubContext;
            _env = env;
            _response = response;

            _culture = new CultureInfo("en-US");
            _culture.NumberFormat.NumberDecimalSeparator = ".";
        }

        private string Round1(double value) => Math.Round(value, 1).ToString(_culture);

        public async Task<ResponseObject<string>> AddSignal(Request_AddSignal request)
        {
            try
            {
                var now = DateTime.Now;
                var dateTimeStr = now.ToString("yyyy-MM-dd HH:mm:ss");
                var status = (request.Status ?? "").Trim().ToUpperInvariant();

                // Case 1: Cancel
                if (status is "CANCEL_ALL" or "CANCEL_VITHE")
                {
                    await _hubContext.Clients.Group("VIP_USERS").SendAsync("AdminSignal", status);
                    // Trả về theo mẫu
                    return _response.responseObjectSuccess("Đã bắn lệnh hủy thành công", status);
                }

                // Case 2: Stop Order Only
                if (request.Price == 0 && request.StopOrderValue != 0 && request.OrderNumber != 0)
                {
                    var msg = $"STOP_ORDER_ONLY\n{status}\n{request.OrderNumber}\n{Round1(request.StopOrderValue)}";
                    await _hubContext.Clients.Group("VIP_USERS").SendAsync("AdminSignal", msg);
                    return _response.responseObjectSuccess("Đã bắn lệnh Stop Order Only", msg);
                }

                // Case 3: Logic tính toán
                var isShort = status == "SHORT";
                var signalWord = isShort ? "short" : "long";
                var stopLoss = isShort ? request.Price * 1.003 : request.Price * 0.997;
                if (request.StopOrderValue != 0) stopLoss = request.StopOrderValue;

                var rawText =
                    $"#VN30 Ngay {dateTimeStr} bot server\n" +
                    $"Tin hieu {signalWord}: Manh\n" +
                    $"Gia mua: {Round1(request.Price)}\n" +
                    $"Target 1: {Round1(request.Price * (isShort ? 0.997 : 1.003))}\n" +
                    $"Target 2: {Round1(request.Price * (isShort ? 0.994 : 1.006))}\n" +
                    $"Target 3: {Round1(request.Price * (isShort ? 0.989 : 1.01))}\n" +
                    $"Target 4: {Round1(request.Price * (isShort ? 0.984 : 1.016))}\n" +
                    $"Cat lo: {Round1(stopLoss)}";

                var cacheResult = _botSignalService.CacheSignal(rawText);
                var messageToSend = cacheResult.Data ?? rawText;

                var suffix = request.StopOrderValue == 0 ? "NO_STOP_ORDER" : "STOP_ORDER";
                var trimmed = messageToSend.TrimEnd();

                if (trimmed.EndsWith("REVERSE", StringComparison.OrdinalIgnoreCase))
                    messageToSend = trimmed + " " + suffix;
                else
                    messageToSend = trimmed + "\n" + suffix;

                if (request.OrderNumber != 0)
                    messageToSend += " " + request.OrderNumber;

                // Bắn Signal
                await _hubContext.Clients.Group("VIP_USERS").SendAsync("AdminSignal", messageToSend);

                // Lưu DB (Hàm cũ trả về ResponseBase, ta lấy message của nó để trả về)
                var dbResult = await _botSignalService.AddSignal(rawText);

                // TRẢ VỀ CHUẨN FORM
                return _response.responseObjectSuccess("Đã bắn tín hiệu và lưu DB thành công", rawText);
            }
            catch (Exception ex)
            {
                // BẮT LỖI CHUẨN FORM
                return _response.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // ====================================================================
        // LOGIC 2: UPLOAD FILE
        // ====================================================================
        public async Task<ResponseObject<string>> UploadScriptAsync(IFormFile file)
        {
            try
            {
                if (!file.FileName.EndsWith(".js"))
                {
                    return _response.responseObjectError(StatusCodes.Status400BadRequest, "Chỉ chấp nhận file .js", null);
                }

                var folderPath = Path.Combine(_env.ContentRootPath, "ScriptStorage");
                if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

                var filePath = Path.Combine(folderPath, "script.js");
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return _response.responseObjectSuccess("Upload script.js thành công vào ScriptStorage!", filePath);
            }
            catch (Exception ex)
            {
                return _response.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<string>> UploadExtensionAsync(IFormFile file)
        {
            try
            {
                if (!file.FileName.EndsWith(".rar") && !file.FileName.EndsWith(".zip"))
                {
                    return _response.responseObjectError(StatusCodes.Status400BadRequest, "Chỉ chấp nhận file .rar hoặc .zip", null);
                }

                if (string.IsNullOrEmpty(_env.WebRootPath))
                    _env.WebRootPath = Path.Combine(_env.ContentRootPath, "wwwroot");

                var filePath = Path.Combine(_env.WebRootPath, "ext.rar");
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return _response.responseObjectSuccess("Upload Extension thành công vào wwwroot!", filePath);
            }
            catch (Exception ex)
            {
                return _response.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<string>> GetScriptContentAsync()
        {
            try
            {
                var filePath = Path.Combine(_env.ContentRootPath, "ScriptStorage", "script.js");

                if (!File.Exists(filePath))
                {
                    return _response.responseObjectError(StatusCodes.Status404NotFound, "Chưa có file script trên server.", null);
                }

                string content = await File.ReadAllTextAsync(filePath);
                return _response.responseObjectSuccess("Lấy nội dung script thành công", content);
            }
            catch (Exception ex)
            {
                return _response.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }
    }
}