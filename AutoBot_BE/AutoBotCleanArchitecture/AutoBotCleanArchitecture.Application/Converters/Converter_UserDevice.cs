using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_UserDevice
    {
        public DTO_UserDevice EntityToDTO(UserDevice userDevice)
        {
            return new DTO_UserDevice
            {
                Id = userDevice.Id,
                AccessToken = userDevice.AccessToken,
                CreatedAt = userDevice.CreatedAt,
                Fingerprint = userDevice.Fingerprint,
                LastActive = userDevice.LastUpdatedAt,
                RefreshToken = userDevice.RefreshToken,
                UserId = userDevice.UserId,
            };
        }
    }
}
