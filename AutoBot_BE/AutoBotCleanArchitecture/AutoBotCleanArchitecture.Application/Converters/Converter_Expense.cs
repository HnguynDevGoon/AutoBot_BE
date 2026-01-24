using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_Expense
    {
        public DTO_Expense EntityToDTO(Expense expenses)
        {
            return new DTO_Expense
            {
                Id = expenses.Id,
                Date = expenses.Date,
                Description = expenses.Description,
                Name = expenses.Name,
                Price = expenses.Price  
            };
        }
    }
}
