using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.OtherContent;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_OtherContent
    {
        Task<ResponseObject<List<DTO_OtherContent>>> GetByOtherType(string otherType);
        Task<ResponseObject<DTO_OtherContent>> GetOtherContentById(Guid id);
        Task<ResponseObject<DTO_OtherContent>> CreateOtherContent(Request_CreateOtherContent request);
        Task<ResponseObject<DTO_OtherContent>> UpdateCreateOtherContent(Request_UpdateOtherContent request);
        Task<ResponseBase> DeleteOtherContent(Guid id);
    }
}
