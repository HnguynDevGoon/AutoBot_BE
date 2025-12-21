using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.BotTrading;
using AutoBotCleanArchitecture.Application.Requests.PriceBot;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Infrastructure.Implements;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BotTradingController : ControllerBase
    {
        private readonly IService_BotTrading service_BotTrading;

        public BotTradingController(IService_BotTrading service_BotTrading)
        {
            this.service_BotTrading = service_BotTrading;
        }

        [HttpGet("GetListBot")]
        public async Task<IActionResult> GetListBot(int pageSize, int pageNumber)
        {
            return Ok(await service_BotTrading.GetListBot(pageSize, pageNumber));
        }

        [HttpGet("GetBotById")]
        [Authorize]
        public async Task<IActionResult> GetBot(Guid id)
        {
            return Ok(await service_BotTrading.GetBot(id));
        }

        [HttpPost("CreateBot")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateBot(Request_BotTrading request)
        {
            return Ok(await service_BotTrading.CreateBot(request));
        }

        [HttpPost("UpdateBot")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateBot(Request_UpdateBotTrading request)
        {
            return Ok(await service_BotTrading.UpdateBot(request));
        }

        [HttpDelete("DeleteBot")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteBot(Guid id)
        {
            return Ok(await service_BotTrading.DeleteBot(id));
        }

        [HttpPost("CreatePriceBot")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePriceBot(Request_CreatePriceBot request)
        {
            return Ok(await service_BotTrading.CreatePriceBot(request));
        }

        [HttpGet("GetListPriceBot")]
        public async Task<IActionResult> GetListPriceBot(int pageSize, int pageNumber)
        {
            return Ok(await service_BotTrading.GetListPriceBot(pageSize, pageNumber));
        }

        [HttpDelete("DeletePriceBot")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePriceBot(Guid id)
        {
            return Ok(await service_BotTrading.DeletePriceBot(id));
        }

        [HttpPost("SearchBotTradingByAdmin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SearchBotTradingByAdmin(Request_SearchBotTradingByAdmin request)
        {
            return Ok(await service_BotTrading.SearchBotTradingByAdmin(request));
        }

        [HttpPost("UpdatePriceBot")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePriceBot(Request_UpdatePriceBot request)
        {
            return Ok(await service_BotTrading.UpdatePriceBot(request));
        }
    }
}
