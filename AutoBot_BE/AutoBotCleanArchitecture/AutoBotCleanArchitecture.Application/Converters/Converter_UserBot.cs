using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_UserBot
    {
        public DTO_UserBot EntityToDTO(UserBot entity)
        {
            return new DTO_UserBot
            {
                Id = entity.Id,
                UserId = entity.UserId,
                UserName = entity.User?.UserName ?? "Unknown User",
                BotTradingId = entity.BotTradingId,
                BotName = entity.BotTrading?.NameBot ?? "Unknown Bot"
            };
        }
    }
}
