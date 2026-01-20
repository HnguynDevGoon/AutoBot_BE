using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.BotSignal;
using AutoBotCleanArchitecture.Data;
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
            if (request.Key != _configuration["SecretKey"])
            {
                return Unauthorized(new { message = "Sai Key bảo mật!" });
            }

            var cacheResult = _serviceBotSignal.CacheSignal(request.Text);
            string messageToSend = cacheResult.Data;

            await _hubContext.Clients.All.SendAsync("Signal", messageToSend);

            var dbResult = await _serviceBotSignal.AddSignal(request.Text);

            if (dbResult.Status != 200) return StatusCode(dbResult.Status, dbResult);
            return Ok(dbResult);
        }
    }
}