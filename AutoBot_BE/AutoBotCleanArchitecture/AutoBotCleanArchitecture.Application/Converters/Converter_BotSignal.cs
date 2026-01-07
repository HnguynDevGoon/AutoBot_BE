using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_BotSignal
    {
        public DTO_BotSignal EntityToDTO(BotSignal botSignal)
        {
            return new DTO_BotSignal
            {
                Id = botSignal.Id,
                DateTime = botSignal.DateTime,
                Price = botSignal.Price,
                Signal = botSignal.Signal,
            };
        }
    }
}
