using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.WalletTransaction;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WalletTransactionController : ControllerBase
    {
        private readonly IService_WalletTransaction service_WalletTransaction;

        public WalletTransactionController(IService_WalletTransaction service_WalletTransaction)
        {
            this.service_WalletTransaction = service_WalletTransaction;
        }
        [HttpGet("GetHistory")]
        [Authorize]
        public async Task<IActionResult> GetHistory(Guid userId, int pageNumber = 1, int pageSize = 10)
        {
            return Ok(await service_WalletTransaction.GetTransactionHistory(userId, pageNumber, pageSize));
        }

        [HttpGet("GetAllTransactionsAdmin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllTransactionsAdmin(int pageSize = 10, int pageNumber = 1)
        {
            return Ok(await service_WalletTransaction.GetAllTransactionsAdmin(pageSize, pageNumber));
        }

        [HttpPost("SearchTransactionsByAdmin")]
        [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> SearchTransactionsByAdmin(Request_SearchTransaction request)
        {
            return Ok(await service_WalletTransaction.SearchTransactionsByAdmin(request));
        }

        [HttpPost("SearchMyTransactions")]
        [Authorize]
        public async Task<IActionResult> SearchMyTransactions(Request_SearchTransaction request)
        {
            // Không cần truyền UserId vì Service tự lấy từ Token
            return Ok(await service_WalletTransaction.SearchMyTransactions(request));
        }

        //[HttpPost("DeductMoney")]
        //[Authorize] 
        //public async Task<IActionResult> DeductMoney([FromBody] Request_DeductMoney request)
        //{
        //    return Ok(await service_WalletTransaction.DeductMoney(request));
        //}
    }
}
