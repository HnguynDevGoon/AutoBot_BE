using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_ProfitLoss
    {
        public DTO_ProfitLoss EntityToDTO(ProfitLoss profitLoss)
        {
            return new DTO_ProfitLoss
            {
                Id = profitLoss.Id,
                Price = profitLoss.Price,
                Date = profitLoss.Date,
                UserId = profitLoss.UserId,
                FullName = profitLoss.User?.FullName
            };
        }
    }
}