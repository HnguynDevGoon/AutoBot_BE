using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_Role
    {
        public DTO_Role EntityToDTO(Role role)
        {
            return new DTO_Role
            {
                Id = role.Id,
                RoleName = role.RoleName
            };
        }
    }
}
