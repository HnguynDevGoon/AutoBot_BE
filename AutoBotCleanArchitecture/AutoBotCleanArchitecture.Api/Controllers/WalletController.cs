using AutoBotCleanArchitecture.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WalletController : ControllerBase
    {
        private readonly IService_Wallet _service_Wallet;

        public WalletController(IService_Wallet service_Wallet)
        {
            _service_Wallet = service_Wallet;
        }

        [HttpGet("GetMoneyInWallet")]
        [Authorize]
        public async Task<IActionResult> GetMoneyInWallet(Guid userId)
        {
            return Ok(await _service_Wallet.GetMoneyInWallet(userId));
        }

        [HttpPost("CreateWallet")]
        [Authorize]
        public async Task<IActionResult> CreateWallet(Guid userId)
        {
            return Ok(await _service_Wallet.CreateWallet(userId));
        }
    }
}