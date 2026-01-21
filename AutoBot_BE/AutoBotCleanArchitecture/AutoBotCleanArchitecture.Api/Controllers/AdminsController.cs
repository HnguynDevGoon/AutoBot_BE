using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Infrastructure.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Globalization;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    // Compat route for existing AdminBot frontend: POST /api/admin/signal/add
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminsController : ControllerBase
    {
        private readonly IService_BotSignal _botSignalService;
        private readonly IHubContext<MessageHub> _hubContext;

        private readonly CultureInfo _culture;

        public AdminsController(IService_BotSignal botSignalService, IHubContext<MessageHub> hubContext)
        {
            _botSignalService = botSignalService;
            _hubContext = hubContext;

            _culture = new CultureInfo("en-US");
            _culture.NumberFormat.NumberDecimalSeparator = ".";
        }

        public class AdminSignalRequest
        {
            public string Status { get; set; } = "";
            public double Price { get; set; }
            public int OrderNumber { get; set; }
            public double StopOrderValue { get; set; }
        }

        private string Round1(double value) => Math.Round(value, 1).ToString(_culture);

        [HttpPost("signal/add")]
        public async Task<IActionResult> AddSignal([FromBody] AdminSignalRequest request)
        {
            // Keep behavior close to legacy Intern/Bot implementation so Service_BotSignal.AddSignal can parse it.
            var now = DateTime.Now;
            var dateTimeStr = now.ToString("yyyy-MM-dd HH:mm:ss");
            var status = (request.Status ?? "").Trim().ToUpperInvariant();

            // Special commands - just broadcast to clients, don't create BotSignal rows.
            if (status is "CANCEL_ALL" or "CANCEL_VITHE")
            {
                await _hubContext.Clients.All.SendAsync("AdminSignal", status);
                return Ok(new { Status = 200, Message = "Broadcasted" });
            }

            // For STOP_ORDER_ONLY we also just broadcast; legacy bot script can act on it if supported.
            if (request.Price == 0 && request.StopOrderValue != 0 && request.OrderNumber != 0)
            {
                var msg = $"STOP_ORDER_ONLY\n{status}\n{request.OrderNumber}\n{Round1(request.StopOrderValue)}";
                await _hubContext.Clients.All.SendAsync("AdminSignal", msg);
                return Ok(new { Status = 200, Message = "Broadcasted" });
            }

            var isShort = status == "SHORT";
            var signalWord = isShort ? "short" : "long";

            var stopLoss = isShort ? request.Price * 1.003 : request.Price * 0.997;
            if (request.StopOrderValue != 0)
            {
                stopLoss = request.StopOrderValue;
            }

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

            // Optional extra info for clients
            // IMPORTANT: keep legacy formatting so the extension can detect REVERSE even after appending flags.
            // Legacy behavior:
            // - If CacheSignal added REVERSE (message differs), append flags on the SAME LINE: "REVERSE NO_STOP_ORDER"
            // - Otherwise append as a new line: "\nNO_STOP_ORDER"
            var suffix = request.StopOrderValue == 0 ? "NO_STOP_ORDER" : "STOP_ORDER";
            var trimmed = messageToSend.TrimEnd();
            if (trimmed.EndsWith("REVERSE", StringComparison.OrdinalIgnoreCase))
            {
                messageToSend = trimmed + " " + suffix;
            }
            else
            {
                messageToSend = trimmed + "\n" + suffix;
            }

            if (request.OrderNumber != 0)
            {
                messageToSend += " " + request.OrderNumber;
            }

            await _hubContext.Clients.All.SendAsync("AdminSignal", messageToSend);

            var dbResult = await _botSignalService.AddSignal(rawText);
            return StatusCode(dbResult.Status, dbResult);
        }
    }
}

