using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.Wallet;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Wallet
    {
        Task<ResponseObject<DTO_Wallet>> GetMoneyInWallet(Guid userId);
        Task<ResponseObject<DTO_Wallet>> CreateWallet(Guid userId);
        Task<ResponseObject<DTO_Wallet>> CreatePinWallet(Request_CreatePinWallet request);
        Task<ResponseObject<DTO_Wallet>> CheckPinWallet(Request_CheckPinWallet request);
        Task<ResponseObject<DTO_Wallet>> GetWalletByUserId(Guid userId);
        Task<ResponseObject<DTO_Wallet>> ResetPin(Request_ResetPin request);
        Task<ResponseBase> SendOtpResetPin(Request_SendOtpResetPin request);
    }
}
