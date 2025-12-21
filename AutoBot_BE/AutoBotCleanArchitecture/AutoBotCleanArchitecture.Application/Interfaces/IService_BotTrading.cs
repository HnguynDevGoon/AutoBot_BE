using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.BotTrading;
using AutoBotCleanArchitecture.Application.Requests.PriceBot;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_BotTrading
    {
        Task<ResponseObject<ResponsePagination<DTO_BotTrading>>> GetListBot(int? pageSize, int? pageNumber);
        Task<ResponseObject<DTO_BotTrading>> GetBot(Guid id);
        Task<ResponseObject<DTO_BotTrading>> CreateBot(Request_BotTrading request);
        Task<ResponseObject<DTO_BotTrading>> UpdateBot(Request_UpdateBotTrading request);
        Task<ResponseBase> DeleteBot(Guid id);
        Task<ResponseBase> CreatePriceBot(Request_CreatePriceBot request);
        Task<ResponseObject<ResponsePagination<DTO_PriceBots>>> GetListPriceBot(int? pageSize, int? pageNumber);
        Task<ResponseBase> DeletePriceBot(Guid id);
        Task<ResponseObject<ResponsePagination<DTO_BotTrading>>> SearchBotTradingByAdmin(Request_SearchBotTradingByAdmin request);
        Task<ResponseObject<DTO_PriceBots>> UpdatePriceBot(Request_UpdatePriceBot request);
    }
}
