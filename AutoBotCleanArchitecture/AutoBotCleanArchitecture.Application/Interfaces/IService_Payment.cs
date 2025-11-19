using AutoBotCleanArchitecture.Application.Requests.Wallet;
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
        Task<ResponseObject<bool>> VerifyDepositStatus(Guid userId);
        //Task<ResponseObject<bool>> HandlePayOSWebhook(WebhookType webhookBody);
    }
}