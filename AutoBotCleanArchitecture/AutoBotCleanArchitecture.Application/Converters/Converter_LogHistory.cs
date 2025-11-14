using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_LogHistory
    {
        public DTO_LogHistory EntityToDTO(LogHistory logHistory)
        {
            return new DTO_LogHistory
            {
                Id = logHistory.Id,
                Signal = logHistory.Signal,
                DateTime = logHistory.DateTime,
                IsSL = logHistory.IsSL,
                ProfitPointTP = logHistory.ProfitPointTP,
                NumberContract = logHistory.NumberContract,
                PriceBuy = logHistory.PriceBuy,

                // Entity LogHistory.UserId là Guid? (nullable)
                // DTO DTO_LogHistory.UserId là Guid (non-nullable)
                // Phải convert an toàn
                UserId = logHistory.UserId ?? Guid.Empty,

                Profit = logHistory.Profit,

                // Phải check null navigation User
                FullName = logHistory.User?.FullName ?? "N/A"
            };
        }
    }
}
