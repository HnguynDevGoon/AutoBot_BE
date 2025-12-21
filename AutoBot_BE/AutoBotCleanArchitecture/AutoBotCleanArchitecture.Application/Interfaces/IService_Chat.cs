using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.ChatMessage;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Chat
    {
        Task<ResponseObject<IList<DTO_ChatMessage>>> GetHistory(Request_GetHistory request);
        Task<ResponseObject<bool>> SendMessage(Request_SendMessage request);
        Task<ResponseObject<bool>> SyncChat(Request_SyncChat request);
        Task<ResponseObject<bool>> SeenMessage(Request_SeenMessage request);
        Task<ResponseObject<IList<DTO_ChatMessage>>> GetResources(Request_GetResources request);
    }
}
