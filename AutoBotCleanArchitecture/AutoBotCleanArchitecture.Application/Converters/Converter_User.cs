using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_User
    {
        public DTO_User EntityToDTO(User user)
        {
            return new DTO_User
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                //PassWord = user.PassWord,
                UrlAvatar = user.UrlAvatar,
                IsActive = user.IsActive,
            };
        }
    }
}
