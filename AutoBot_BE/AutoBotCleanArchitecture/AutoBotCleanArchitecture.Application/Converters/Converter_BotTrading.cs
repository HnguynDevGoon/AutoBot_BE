using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_BotTrading
    {
        public DTO_BotTrading EntityToDTO(BotTrading botTrading)
        {
            return new DTO_BotTrading
            {
                Id = botTrading.Id,
                CommandNumber = botTrading.CommandNumber,
                InterestRate = botTrading.InterestRate,
                NameBot = botTrading.NameBot,
                TotalProfit = botTrading.TotalProfit,
                WinRate = botTrading.WinRate,
            };
        }
    }
}
