using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.UserBot;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserBotController : ControllerBase
    {
        private readonly IService_UserBot service_UserBot;

        public UserBotController(IService_UserBot service_UserBot)
        {
            this.service_UserBot = service_UserBot;
        }

        [HttpGet("GetUserBots")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserBots(int pageNumber = 1, int pageSize = 10)
        {
            return Ok(await service_UserBot.GetUserBots(pageNumber, pageSize));
        }

        [HttpGet("GetUserBotById")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserBotById(Guid id)
        {
            return Ok(await service_UserBot.GetUserBotById(id));
        }

        [HttpPost("AddUserBot")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddUserBot([FromBody] Request_AddUserBot request)
        {
            return Ok(await service_UserBot.AddUserBot(request));
        }

        [HttpPut("UpdateUserBot")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserBot([FromBody] Request_UpdateUserBot request)
        {
            return Ok(await service_UserBot.UpdateUserBot(request));
        }

        [HttpDelete("DeleteUserBot")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUserBot(Guid id)
        {
            return Ok(await service_UserBot.DeleteUserBot(id));
        }
    }
}