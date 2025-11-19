using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_Wallet
    {
        public DTO_Wallet EntityToDTO(Wallet wallet)
        {
            return new DTO_Wallet
            {
                Id = wallet.Id,
                Balance = wallet.Balance,   
                UserId = wallet.UserId, 
            };
        }
    }
}
