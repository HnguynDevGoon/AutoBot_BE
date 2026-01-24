using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.AdminFile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/admin")]
    [ApiController]
    public class AdminsController : ControllerBase
    {
        private readonly IService_AdminFile _serviceAdmin;

        public AdminsController(IService_AdminFile serviceAdmin)
        {
            _serviceAdmin = serviceAdmin;
        }

        [HttpPost("signal/add")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddSignal([FromBody] Request_AddSignal request)
        {
            return Ok(await _serviceAdmin.AddSignal(request));
        }

        [HttpPost("upload-script")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            return Ok(await _serviceAdmin.UploadScriptAsync(file));
        }

        [HttpPost("upload-ext")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadExt(IFormFile file)
        {
            return Ok(await _serviceAdmin.UploadExtensionAsync(file));
        }

        [HttpGet("/api/auth/router")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRouterScript()
        {
            var result = await _serviceAdmin.GetScriptContentAsync();

            if (result.Status != 200) 
            {
                return Content($"console.error('{result.Message}');", "application/javascript");
            }

            return Content(result.Data, "application/javascript");
        }
    }
}