using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.OtherContent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OtherContentController : ControllerBase
    {
        private readonly IService_OtherContent service_OtherContent;

        public OtherContentController(IService_OtherContent service_OtherContent)
        {
            this.service_OtherContent = service_OtherContent;
        }

        [HttpGet("GetByOtherType")]
        public async Task<IActionResult> GetByOtherType(string otherType)
        {
            return Ok(await service_OtherContent.GetByOtherType(otherType));
        }

        [HttpGet("GetOtherContentById")]
        public async Task<IActionResult> GetOtherContentById(Guid id)
        {
            return Ok(await service_OtherContent.GetOtherContentById(id));
        }

        [HttpPost("CreateOtherContent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateOtherContent(Request_CreateOtherContent request)
        {
            return Ok(await service_OtherContent.CreateOtherContent(request));
        }

        [HttpPut("UpdateOtherContent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOtherContent(Request_UpdateOtherContent request)
        {
            return Ok(await service_OtherContent.UpdateCreateOtherContent(request));
        }

        [HttpDelete("DeleteOtherContent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteOtherContent(Guid id)
        {
            return Ok(await service_OtherContent.DeleteOtherContent(id));
        }
    }
}