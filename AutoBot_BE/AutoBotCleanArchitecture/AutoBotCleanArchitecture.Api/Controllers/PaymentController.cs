using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Payment;
using AutoBotCleanArchitecture.Application.Requests.Wallet;
using AutoBotCleanArchitecture.Application.Requests.WithdrawMoney;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Net.payOS;
using Net.payOS.Types;
using System;
using System.Threading.Tasks;

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

        [HttpPost("CreateWalletDepositLink")]
        [Authorize]
        public async Task<IActionResult> CreateWalletDepositLink(Request_Deposit request)
        {
            return Ok(await _servicePayment.CreateWalletDepositLink(request));
        }

        [HttpPost("RequestWithdrawMoney")]
        [Authorize]
        public async Task<IActionResult> RequestWithdrawMoney(Request_WithdrawMoney request)
        {
            return Ok(await _servicePayment.RequestWithdrawMoney(request));
        }

        [HttpGet("GetWithdrawRequestsAsync")]
        [Authorize]
        public async Task<IActionResult> GetWithdrawRequestsAsync(int pageNumber, int pageSize)
        {
            return Ok(await _servicePayment.GetWithdrawRequestsAsync(pageNumber, pageSize));
        }

        [HttpPost("CreateBuyBotLink")]
        [Authorize]
        public async Task<IActionResult> CreateBuyBotLink(Request_BuyBot request)
        {
            return Ok(await _servicePayment.CreateBuyBotLink(request));
        }

        [HttpPost("ProcessWebhook")]
        public async Task<IActionResult> ProcessWebhook([FromBody] WebhookType webhookData)
        {
            var result = await _servicePayment.ProcessWebhook(webhookData);
            return Ok(result);
        }

    }
}