using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.Payment;
using AutoBotCleanArchitecture.Application.Requests.Wallet;
using AutoBotCleanArchitecture.Application.Requests.WithdrawMoney;
using AutoBotCleanArchitecture.Application.Responses;
using Net.payOS;
using Net.payOS.Types;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Payment
    {
        Task<ResponseObject<string>> CreateWalletDepositLink(Request_Deposit request);
        Task<ResponseObject<bool>> ActivateDepositAfterPayment(long orderCode, double amount);
        Task<ResponseObject<bool>> RequestWithdrawMoney(Request_WithdrawMoney request);
        Task<ResponseObject<ResponsePagination<DTO_WithdrawMoney>>> GetWithdrawRequestsAsync(int pageNumber, int pageSize);
        Task<ResponseObject<string>> CreateBuyBotLink(Request_BuyBot request);
        Task<ResponseObject<bool>> ActivateBotAfterPayment(long orderCode, double amount);
        Task<ResponseObject<bool>> ProcessWebhook(WebhookType webhookData);

    }
}