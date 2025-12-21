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
    public interface IService_ChatRoom
    {
        Task<ResponseObject<List<DTO_ChatRoom>>> GetChatRooms();
        Task<ResponseObject<DTO_ChatRoom>> DeleteChatRoom(Guid chatRoomId);
    }
}
