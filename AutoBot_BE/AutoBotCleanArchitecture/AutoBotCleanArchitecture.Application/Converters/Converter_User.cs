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
                FullName = user.FullName,
                UserName = user.UserName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                PassWord = user.PassWord,
                UrlAvatar = user.UrlAvatar,
                BirthDay = user.BirthDay,
                CreatedDate = user.CreatedDate,
                IsActive = user.IsActive,
                AccessFailedCount = user.AccessFailedCount,
                LockoutEnable = user.LockoutEnable,
                LockoutEnd = user.LockoutEnd,
                TwoStep = user.TwoStep,
                RoleName = user.Role?.RoleName,
            };
        }
    }
}
