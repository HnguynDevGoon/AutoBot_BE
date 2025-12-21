using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.PurchaseHistory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseHistoryController : ControllerBase
    {
        private readonly IService_PurchaseHistory service_PurchaseHistory;

        public PurchaseHistoryController(IService_PurchaseHistory service_PurchaseHistory)
        {
            this.service_PurchaseHistory = service_PurchaseHistory;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(Request_AddPurchaseHistory request)
        {
            return Ok(await service_PurchaseHistory.AddPurchaseHistory(request));
        }

        [HttpGet("GetMyHistory")]
        [Authorize]
        public async Task<IActionResult> GetMyHistory()
        {
            return Ok(await service_PurchaseHistory.GetMyHistory());
        }

        [HttpGet("GetAll")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await service_PurchaseHistory.GetAll());
        }

        [HttpGet("GetByUser")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByUser(Guid userId)
        {
            return Ok(await service_PurchaseHistory.GetByUser(userId));
        }

        [HttpGet("GetLastPurchaseByUser")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetLastByUser(Guid userId)
        {
            return Ok(await service_PurchaseHistory.GetLastPurchaseByUser(userId));
        }

        [HttpGet("GetPurchaseHistoriesMonthByUser")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByMonthUser(Guid userId, int month, int year)
        {
            return Ok(await service_PurchaseHistory.GetPurchaseHistoriesMonthByUser(userId, month, year));
        }

        [HttpGet("GetPurchaseHistoriesYearByUser")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByYearUser(Guid userId, int year)
        {
            return Ok(await service_PurchaseHistory.GetPurchaseHistoriesYearByUser(userId, year));
        }

        [HttpPost("UpdatePurchaseHistory")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, Request_AddPurchaseHistory request)
        {
            return Ok(await service_PurchaseHistory.UpdatePurchaseHistory(id, request));
        }

        [HttpDelete("DeletePurchaseHistory")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            return Ok(await service_PurchaseHistory.DeletePurchaseHistory(id));
        }

        [HttpGet("GetRevenueByMonth")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRevenueMonth(int month, int year)
        {
            return Ok(await service_PurchaseHistory.GetRevenueByMonth(month, year));
        }

        [HttpGet("GetRevenueByYear")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRevenueYear(int year)
        {
            return Ok(await service_PurchaseHistory.GetRevenueByYear(year));
        }

        [HttpGet("GetRevenueByDateRange")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRevenueRange(DateTime from, DateTime to)
        {
            return Ok(await service_PurchaseHistory.GetRevenueByDateRange(from, to));
        }
    }
}