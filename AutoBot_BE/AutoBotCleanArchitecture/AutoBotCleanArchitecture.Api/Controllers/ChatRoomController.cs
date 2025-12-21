using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.ChatMessage;
using AutoBotCleanArchitecture.Infrastructure.Implements;
using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatRoomController : ControllerBase
    {
        private readonly IService_ChatRoom service_ChatRoom;

        public ChatRoomController(IService_ChatRoom service_ChatRoom)
        {
            this.service_ChatRoom = service_ChatRoom;
        }

        [HttpGet("GetChatRooms")]
        // [Authorize(Roles = "Admin")] // Uncomment nếu muốn chặn User thường gọi API này
        public async Task<IActionResult> GetChatRooms()
        {
            return Ok(await service_ChatRoom.GetChatRooms());
        }

        [HttpDelete("DeleteChatRoom")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteChatRoom(Guid chatroomId)
        {
            return Ok(await service_ChatRoom.DeleteChatRoom(chatroomId));
        }
    }
}
