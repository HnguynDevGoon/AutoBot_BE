using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.BotSignal;
using AutoBotCleanArchitecture.Infrastructure.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BotSignalController : ControllerBase
    {
        private readonly IService_BotSignal _serviceBotSignal;
        private readonly IHubContext<MessageHub> _hubContext;
        private readonly IConfiguration _configuration;

        public BotSignalController(
            IService_BotSignal serviceBotSignal,
            IHubContext<MessageHub> hubContext,
            IConfiguration configuration)
        {
            _serviceBotSignal = serviceBotSignal;
            _hubContext = hubContext;
            _configuration = configuration;
        }

        [HttpGet("GetSignals")]
        public async Task<IActionResult> GetSignals()
        {
            return Ok(await _serviceBotSignal.GetSignals());
        }

        [HttpPost("SendMessage")]
        public async Task<IActionResult> SendMessage([FromForm] Request_AddSignal request)
        {
            if (request.Key != _configuration["AppSettings:SecretKey"])
            {
                return Unauthorized(new { message = "Sai Key bảo mật!" });
            }

            var cacheResult = _serviceBotSignal.CacheSignal(request.Text);
            string messageToSend = cacheResult.Data;

            // ======================================================
            // SỬA ĐÚNG DÒNG NÀY THÌ NGƯỜI THƯỜNG MỚI KHÔNG NHẬN ĐƯỢC
            // ======================================================

            // SAI (Code cũ): Gửi cho tất cả mọi người đang kết nối
            // await _hubContext.Clients.All.SendAsync("Signal", messageToSend);

            // ĐÚNG (Code mới): Chỉ gửi cho nhóm VIP đã được lọc ở MessageHub
            await _hubContext.Clients.Group("VIP_USERS").SendAsync("Signal", messageToSend);

            // Gửi thêm tín hiệu Admin nếu có
            await _hubContext.Clients.Group("VIP_USERS").SendAsync("AdminSignal", request.Text);

            // ======================================================

            var dbResult = await _serviceBotSignal.AddSignal(request.Text);

            if (dbResult.Status != 200) return StatusCode(dbResult.Status, dbResult);
            return Ok(dbResult);
        }
    }
}