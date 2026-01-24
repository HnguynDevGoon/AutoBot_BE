using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_Salary
    {
        public DTO_Salary EntityToDTO(Salary salaries)
        {
            return new DTO_Salary
            {
                Id = salaries.Id,
                Bonus = salaries.Bonus,
                Description = salaries.Description,
                Month = salaries.Month,
                Price = salaries.Price,
                Year = salaries.Year,
                FullName = salaries.User.FullName,
                UserId = salaries.User.Id
            };
        }
    }
}
