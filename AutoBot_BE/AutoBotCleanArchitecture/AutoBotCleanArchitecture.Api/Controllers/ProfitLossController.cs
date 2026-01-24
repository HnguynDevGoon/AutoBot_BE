using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.ProfitLoss;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfitLossController : ControllerBase
    {
        private readonly IService_ProfitLoss service_ProfitLoss;

        public ProfitLossController(IService_ProfitLoss service_ProfitLoss)
        {
            this.service_ProfitLoss = service_ProfitLoss;
        }

        [HttpGet("GetProfitLosses")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetProfitLosses(int pageNumber, int pageSize)
        {
            return Ok(await service_ProfitLoss.GetProfitLosses(pageNumber,pageSize));
        }

        [HttpPost("CreateProfitLoss")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProfitLoss(Request_CreateProfitLoss request)
        {
            return Ok(await service_ProfitLoss.CreateProfitLoss(request));
        }

        [HttpPut("UpdateProfitLoss")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProfitLoss(Request_UpdateProfitLoss request)
        {
            return Ok(await service_ProfitLoss.UpdateProfitLoss(request));
        }

        [HttpDelete("DeleteProfitLoss")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProfitLoss(Guid id)
        {
            return Ok(await service_ProfitLoss.DeleteProfitLoss(id));
        }

        [HttpGet("GetProfitLossByDay")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetProfitLossByDay(int day, int month, int year, Guid userId)
        {
            return Ok(await service_ProfitLoss.GetProfitLossByDay(day, month, year, userId));
        }

        [HttpGet("GetProfitLossByMonth")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetProfitLossByMonth(int month, int year, Guid userId)
        {
            return Ok(await service_ProfitLoss.GetProfitLossByMonth(month, year, userId));
        }

        [HttpGet("GetProfitLossByYear")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetProfitLossByYear(int year, Guid userId)
        {
            return Ok(await service_ProfitLoss.GetProfitLossByYear(year, userId));
        }

        [HttpGet("GetProfitLossAll")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetProfitLossAll(Guid userId)
        {
            return Ok(await service_ProfitLoss.GetProfitLossAll(userId));
        }
    }
}