using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Device
    {
        Task<List<DTO_UserDevice>> GetDevices();
        Task<UserDevice> GetAccessTokens(Guid userId, string fingerprint);
        Task<ResponseObject<List<DTO_UserDevice>>> LogoutAllDevices();
        Task<ResponseObject<DTO_UserDevice>> UserLogout();
        Task<ResponseObject<DTO_UserDevice>> LogoutDevice(Guid deviceId);
    }
}
