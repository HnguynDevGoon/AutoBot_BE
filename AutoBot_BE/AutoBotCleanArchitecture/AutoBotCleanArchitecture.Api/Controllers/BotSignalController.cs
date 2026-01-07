using AutoBotCleanArchitecture.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BotSignalController : ControllerBase
    {
        private readonly IService_BotSignal service_BotSignal;

        public BotSignalController(IService_BotSignal service_BotSignal)
        {
            this.service_BotSignal = service_BotSignal;
        }

        [HttpGet("GetSignals")]
        public async Task<IActionResult> GetSignals()
        {
            return Ok(await service_BotSignal.GetSignals());
        }

        [HttpPost("AddSignal")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddSignal([FromBody] string text)
        {
            return Ok(await service_BotSignal.AddSignal(text));
        }
    }
}