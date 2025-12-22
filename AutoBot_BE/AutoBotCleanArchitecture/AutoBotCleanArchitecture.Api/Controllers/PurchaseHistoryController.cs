using AutoBotCleanArchitecture.Application.Interfaces;
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
        private readonly IService_PurchaseHistory servicePurchaseHistory;

        public PurchaseHistoryController(IService_PurchaseHistory servicePurchaseHistory)
        {
            this.servicePurchaseHistory = servicePurchaseHistory;
        }

        // =================================================================================
        // PHẦN 1: USER API (CÁ NHÂN - DÙNG TOKEN)
        // =================================================================================

        [HttpGet("GetPayOSHistory")]
        public async Task<IActionResult> GetPayOSHistory(int pageNumber = 1, int pageSize = 10)
        {
            var result = await servicePurchaseHistory.GetMyHistoryByPaymentMethod("PayOS", pageNumber, pageSize);
            return Ok(result);
        }

        [HttpGet("GetWalletHistory")]
        public async Task<IActionResult> GetWalletHistory(int pageNumber = 1, int pageSize = 10)
        {
            var result = await servicePurchaseHistory.GetMyHistoryByPaymentMethod("Wallet", pageNumber, pageSize);
            return Ok(result);
        }

        // 2. Xem giao dịch gần nhất của tôi
        [HttpGet("GetMyLastPurchase")]
        [Authorize]
        public async Task<IActionResult> GetMyLastPurchase()
        {
            return Ok(await servicePurchaseHistory.GetMyLastPurchase());
        }

        // 3. Lọc theo tháng (Của tôi)
        [HttpGet("GetMyHistoryByMonth")]
        [Authorize]
        public async Task<IActionResult> GetMyHistoryByMonth(int month, int year)
        {
            return Ok(await servicePurchaseHistory.GetMyHistoryByMonth(month, year));
        }

        // 4. Lọc theo năm (Của tôi)
        [HttpGet("GetMyHistoryByYear")]
        [Authorize]
        public async Task<IActionResult> GetMyHistoryByYear(int year)
        {
            return Ok(await servicePurchaseHistory.GetMyHistoryByYear(year));
        }


        // =================================================================================
        // PHẦN 2: ADMIN API (QUẢN LÝ - CẦN USERID)
        // =================================================================================

        // 1. Xóa lịch sử (Chỉ Admin)
        [HttpDelete("DeletePurchaseHistory")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            return Ok(await servicePurchaseHistory.DeletePurchaseHistory(id));
        }

        // 2. Xem tất cả lịch sử hệ thống
        [HttpGet("GetAll")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await servicePurchaseHistory.GetAll());
        }

        // 3. Xem lịch sử của user cụ thể
        [HttpGet("GetByUser")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByUser(Guid userId)
        {
            return Ok(await servicePurchaseHistory.GetByUser(userId));
        }

        // 4. Xem giao dịch cuối của user cụ thể
        [HttpGet("GetLastPurchaseByUser")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetLastByUser(Guid userId)
        {
            return Ok(await servicePurchaseHistory.GetLastPurchaseByUser(userId));
        }

        // 5. Lọc tháng của user cụ thể
        [HttpGet("GetPurchaseHistoriesMonthByUser")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByMonthUser(Guid userId, int month, int year)
        {
            return Ok(await servicePurchaseHistory.GetPurchaseHistoriesMonthByUser(userId, month, year));
        }

        // 6. Lọc năm của user cụ thể
        [HttpGet("GetPurchaseHistoriesYearByUser")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByYearUser(Guid userId, int year)
        {
            return Ok(await servicePurchaseHistory.GetPurchaseHistoriesYearByUser(userId, year));
        }


        // =================================================================================
        // PHẦN 3: THỐNG KÊ DOANH THU (ADMIN)
        // =================================================================================

        [HttpGet("GetRevenueByMonth")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRevenueMonth(int month, int year)
        {
            return Ok(await servicePurchaseHistory.GetRevenueByMonth(month, year));
        }

        [HttpGet("GetRevenueByYear")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRevenueYear(int year)
        {
            return Ok(await servicePurchaseHistory.GetRevenueByYear(year));
        }

        [HttpGet("GetRevenueByDateRange")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRevenueRange(DateTime from, DateTime to)
        {
            return Ok(await servicePurchaseHistory.GetRevenueByDateRange(from, to));
        }
    }
}