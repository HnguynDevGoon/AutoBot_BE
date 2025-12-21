using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Content;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContentController : ControllerBase
    {
        private readonly IService_Content service_Content;

        public ContentController(IService_Content service_Content)
        {
            this.service_Content = service_Content;
        }

        [HttpGet("GetListContent")]
        public async Task<IActionResult> GetListContent(int pageSize = 10, int pageNumber = 1)
        {
            return Ok(await service_Content.GetListContent(pageSize, pageNumber));
        }

        [HttpGet("GetContentById")]
        public async Task<IActionResult> GetContentById(Guid id)
        {
            return Ok(await service_Content.GetContentById(id));
        }

        [HttpPost("CreateContent")]
        [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> CreateContent(Request_CreateContent request)
        {
            return Ok(await service_Content.CreateContent(request));
        }

        [HttpPut("UpdateContent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateContent(Request_UpdateContent request)
        {
            return Ok(await service_Content.UpdateContent(request));
        }

        [HttpDelete("DeleteContent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteContent(Guid id)
        {
            return Ok(await service_Content.DeleteContent(id));
        }

        [HttpPost("SearchContent")]
        public async Task<IActionResult> SearchContent(Request_SearchContent request)
        {
            return Ok(await service_Content.SearchContent(request));
        }
    }
}