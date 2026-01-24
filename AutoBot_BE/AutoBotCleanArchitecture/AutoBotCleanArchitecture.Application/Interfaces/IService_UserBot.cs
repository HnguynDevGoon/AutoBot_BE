using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.UserBot;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_UserBot
    {
        Task<ResponseObject<ResponsePagination<DTO_UserBot>>> GetUserBots(int pageNumber, int pageSize);
        Task<ResponseObject<DTO_UserBot>> GetUserBotById(Guid id);
        Task<ResponseBase> AddUserBot(Request_AddUserBot request);
        Task<ResponseBase> UpdateUserBot(Request_UpdateUserBot request);
        Task<ResponseBase> DeleteUserBot(Guid id);
    }
}