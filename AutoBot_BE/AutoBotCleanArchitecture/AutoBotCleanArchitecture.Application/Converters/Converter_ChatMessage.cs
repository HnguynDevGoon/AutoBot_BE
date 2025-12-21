using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_ChatMessage
    {
        public DTO_ChatMessage EntityToDTO(ChatMessage chatMessage)
        {
            return new DTO_ChatMessage
            {
                Id = chatMessage.Id,
                IpAddress = chatMessage.IpAddress,
                IsAdminSender = chatMessage.IsAdminSender,
                IsRead = chatMessage.IsRead,
                Message = chatMessage.Message,
                Timestamp = chatMessage.Timestamp,
                TypeMessage = chatMessage.TypeMessage,
            };
        }

    }
}
