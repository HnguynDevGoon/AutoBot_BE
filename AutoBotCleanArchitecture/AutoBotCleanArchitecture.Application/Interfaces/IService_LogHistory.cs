    using AutoBotCleanArchitecture.Application.DTOs;
    using AutoBotCleanArchitecture.Application.Requests.LogHistory;
    using AutoBotCleanArchitecture.Application.Responses;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    namespace AutoBotCleanArchitecture.Application.Interfaces
    {
        public interface IService_LogHistory 
        {
            Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistory();
            Task<ResponseObject<DTO_LogHistory>> AddLogHistory(Request_LogHistory request);
            Task<bool> DeleteLogHistory(Guid id);
            Task<ResponseObject<DTO_LogHistory>> UpdateLogHistory(Guid id, Request_LogHistory request);
            Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistoryDay(int day, int month, int year, Guid userId);
            Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistoryMonth(int month, int year, Guid userId);
            Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistoryYear(int year, Guid userId);
            Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistoryById(Guid userId);
        }
    }
