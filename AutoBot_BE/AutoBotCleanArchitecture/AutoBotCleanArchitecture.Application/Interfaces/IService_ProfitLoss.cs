using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.ProfitLoss;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_ProfitLoss
    {
        Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLosses();
        Task<ResponseObject<DTO_ProfitLoss>> CreateProfitLoss(Request_CreateProfitLoss request);
        Task<ResponseObject<DTO_ProfitLoss>> UpdateProfitLoss(Request_UpdateProfitLoss request);
        Task<ResponseBase> DeleteProfitLoss(Guid id);
        Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLossByDay(int day, int month, int year, Guid userId);
        Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLossByMonth(int month, int year, Guid userId);
        Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLossByYear(int year, Guid userId);
        Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLossAll(Guid userId);
    }
}