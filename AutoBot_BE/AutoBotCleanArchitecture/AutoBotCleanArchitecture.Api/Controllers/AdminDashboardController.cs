using AutoBotCleanArchitecture.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IService_AdminDashboard service_AdminDashboard;

        public AdminDashboardController(IService_AdminDashboard service_AdminDashboard)
        {
            this.service_AdminDashboard = service_AdminDashboard;
        }

        [HttpGet("SearchGlobal")]
        [Authorize]
        public async Task<IActionResult> SearchGlobal(string keyword)
        {
            return Ok(await service_AdminDashboard.SearchGlobal(keyword));
        }
    }
}