using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.Content;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Content
    {
        Task<ResponseObject<ResponsePagination<DTO_Content>>> GetListContent(int pageSize, int pageNumber);
        Task<ResponseObject<DTO_Content>> GetContentById(Guid id);
        Task<ResponseObject<DTO_Content>> CreateContent(Request_CreateContent request);
        Task<ResponseObject<DTO_Content>> UpdateContent(Request_UpdateContent request);
        Task<ResponseBase> DeleteContent(Guid id);
        Task<ResponseObject<ResponsePagination<DTO_Content>>> SearchContent(Request_SearchContent request);
    }
}
