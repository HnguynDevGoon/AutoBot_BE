using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_BotSignal
    {
        Task<ResponseObject<List<DTO_BotSignal>>> GetSignals();
        ResponseObject<string> CacheSignal(string rawText);
        Task<ResponseBase> AddSignal(string rawText);

    }
}
