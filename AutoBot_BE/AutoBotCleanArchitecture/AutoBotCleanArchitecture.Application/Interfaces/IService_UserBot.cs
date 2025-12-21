using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.UserBot;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_UserBot
    {
        Task<ResponseBase> AddUserBot(Request_AddUserBot request);

        Task<ResponseBase> DeleteUserBot(Guid userId, Guid botTradingId);

        Task<ResponseObject<List<DTO_UserBot>>> GetUserBots();

        Task<bool> ExistUserBot(Guid userId, Guid botTradingId);
    }
}
