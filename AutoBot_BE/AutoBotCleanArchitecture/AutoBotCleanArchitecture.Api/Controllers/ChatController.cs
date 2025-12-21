using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.ChatMessage;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Infrastructure.Implements;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IService_Chat service_Chat;

        public ChatController(IService_Chat service_Chat)
        {
            this.service_Chat = service_Chat;
        }

        [HttpPost("SendMessage")]
        [AllowAnonymous] // Khách vãng lai OK
        public async Task<IActionResult> SendMessage([FromBody] Request_SendMessage request)
        {
            // Logic lấy IP/User đã chuyển vào Service
            return Ok(await service_Chat.SendMessage(request));
        }

        [HttpGet("GetHistory")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHistory([FromQuery] Request_GetHistory request)
        {
            return Ok(await service_Chat.GetHistory(request));
        }

        [HttpPost("SyncChat")]
        [Authorize]
        public async Task<IActionResult> SyncChat([FromBody] Request_SyncChat request)
        {
            // Controller không làm gì cả, chỉ chuyển tiếp
            return Ok(await service_Chat.SyncChat(request));
        }

        [HttpPost("SeenMessage")]
        [Authorize]
        public async Task<IActionResult> SeenMessage([FromBody] Request_SeenMessage request)
        {
            return Ok(await service_Chat.SeenMessage(request));
        }

        [HttpGet("GetResources")]
        [Authorize]
        public async Task<IActionResult> GetResources([FromQuery] Request_GetResources request)
        {
            return Ok(await service_Chat.GetResources(request));
        }
    }
}