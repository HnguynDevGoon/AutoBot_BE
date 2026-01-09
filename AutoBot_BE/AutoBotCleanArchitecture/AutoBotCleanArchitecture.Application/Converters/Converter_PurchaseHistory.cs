using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_PurchaseHistory
    {
        public DTO_PurchaseHistory EntityToDTO(PurchaseHistory entity)
        {
            return new DTO_PurchaseHistory
            {
                Id = entity.Id,
                PriceBot = entity.PriceBot, 
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                PaymentMethod = entity.PaymentMethod,
                Status = entity.Status,
                Date = entity.Date,
                OrderCode = entity.OrderCode,       
                NameBot = entity.BotTrading?.NameBot,
                UserId = entity.UserId,
                UserName = entity.User != null ? entity.User.FullName : "Unknown User"
            };
        }
    }
}
