using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Wallet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Net.payOS;
using Net.payOS.Types;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IService_Payment _servicePayment;

        public PaymentController(IService_Payment servicePayment)
        {
            _servicePayment = servicePayment;
        }

        // 1. Tạo Link 
        [HttpPost("CreateWalletDepositLink")]
        [Authorize]
        public async Task<IActionResult> CreateWalletDepositLink(Request_Deposit request)
        {
            return Ok(await _servicePayment.CreateWalletDepositLink(request));
        }

        // 2. Check Thanh Toán 
        [HttpGet("VerifyDepositStatus")]
        [Authorize]
        public async Task<IActionResult> VerifyDepositStatus(Guid userId) 
        {
            return Ok(await _servicePayment.VerifyDepositStatus(userId));
        }

        // 3. Webhook
        //[HttpPost("payos-webhook")]
        //[AllowAnonymous]
        //public async Task<IActionResult> PayOSWebhook([FromBody] WebhookType body)
        //{
        //    return Ok(await _servicePayment.HandlePayOSWebhook(body));
        //}
    }
}