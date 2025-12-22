using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Responses;
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
        Task<List<DTO_UserDevice>> GetAccessTokens();
        Task<ResponseObject<List<DTO_UserDevice>>> LogoutAllDevices();
        Task<ResponseObject<DTO_UserDevice>> UserLogout();
        Task<ResponseObject<DTO_UserDevice>> LogoutDevice(Guid deviceId);
    }
}
