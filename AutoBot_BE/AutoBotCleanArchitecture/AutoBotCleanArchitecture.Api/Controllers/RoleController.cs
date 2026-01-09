using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Role;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly IService_Role service_Role;

        public RoleController(IService_Role service_Role)
        {
            this.service_Role = service_Role;
        }

        [HttpPost("CreateRole")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateRole(Request_CreateRole request)
        {
            return Ok(await service_Role.CreateRole(request));
        }
        [HttpPost("UpdateRole")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRole(Request_UpdateRole request)
        {
            return Ok(await service_Role.UpdateRole(request));
        }
        [HttpGet("GetListRole")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetListRole(int pageSize = 10, int pageNumber = 1)
        {
            return Ok(await service_Role.GetListRole(pageSize, pageNumber));
        }
        [HttpGet("GetRoleById")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRoleById(Guid roleId)
        {
            return Ok(await service_Role.GetRoleById(roleId));
        }
        [HttpDelete("DeleteRole")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteRole(Guid roleId)
        {
            return Ok(await service_Role.DeleteRole(roleId));
        }
    }
}
