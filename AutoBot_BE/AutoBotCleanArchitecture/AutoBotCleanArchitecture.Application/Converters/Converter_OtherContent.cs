using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_OtherContent
    {
        public DTO_OtherContent EntityToDTO(OtherContent otherContent)
        {
            return new DTO_OtherContent
            {
                Id = otherContent.Id,
                Description = otherContent.Description,
                Icon = otherContent.Icon,
                Title = otherContent.Title,
                OtherType = otherContent.OtherType,
            };
        }
    }
}
