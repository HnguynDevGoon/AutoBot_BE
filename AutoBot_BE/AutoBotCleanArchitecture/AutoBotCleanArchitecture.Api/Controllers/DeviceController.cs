using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Device;
using AutoBotCleanArchitecture.Infrastructure.Implements;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeviceController : ControllerBase
    {
        private readonly IService_Device service_Device;

        public DeviceController(IService_Device service_Device)
        {
            this.service_Device = service_Device;
        }

        [HttpPost("GetDevices")]
        [Authorize]
        public async Task<IActionResult> GetDevices(Request_GetDevices request)
        {
            return Ok(await service_Device.GetDevices(request));
        }

        [HttpGet("GetAccessTokens")]
        //[Authorize]
        public async Task<IActionResult> GetAccessTokens(Guid userId)
        {
            return Ok(await service_Device.GetAccessTokens(userId));
        }

        [HttpPost("LogoutAllDevices")]
        [Authorize]
        public async Task<IActionResult> LogoutAllDevices()
        {
            return Ok(await service_Device.LogoutAllDevices());
        }

        [HttpPost("UserLogout")]
        [Authorize]
        public async Task<IActionResult> UserLogout()
        {
            return Ok(await service_Device.UserLogout());
        }

        [HttpDelete("LogoutDevice")]
        [Authorize]
        public async Task<IActionResult> LogoutDevice(Guid deviceId)
        {
            return Ok(await service_Device.LogoutDevice(deviceId));
        }
    }
}
