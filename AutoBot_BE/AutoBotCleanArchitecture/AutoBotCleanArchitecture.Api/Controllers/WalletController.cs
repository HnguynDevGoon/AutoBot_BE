using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Wallet;
using Azure.Core;
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

        [HttpPost("CreatePinWallet")]
        [Authorize]
        public async Task<IActionResult> CreatePinWallet(Request_CreatePinWallet request)
        {
            return Ok(await _service_Wallet.CreatePinWallet(request));
        }

        [HttpPost("CheckPinWallet")]
        [Authorize]
        public async Task<IActionResult> CheckPinWallet(Request_CheckPinWallet request)
        {
            return Ok(await _service_Wallet.CheckPinWallet(request));
        }

        [HttpGet("GetWalletByUserId")]
        [Authorize]
        public async Task<IActionResult> GetWalletByUserId(Guid userId)
        {
            return Ok(await _service_Wallet.GetWalletByUserId(userId));
        }

        [HttpPost("ResetPin")]
        [Authorize]
        public async Task<IActionResult> ResetPin(Request_ResetPin request)
        {
            return Ok(await _service_Wallet.ResetPin(request));
        }

        [HttpPost("SendOtpResetPin")]
        [Authorize]
        public async Task<IActionResult> SendOtpResetPin(Request_SendOtpResetPin request)
        {
            return Ok(await _service_Wallet.SendOtpResetPin(request));
        }
    }
}