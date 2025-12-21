using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.LogHistory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LogHistoryController : ControllerBase
    {
        private readonly IService_LogHistory _logHistoryService;

        public LogHistoryController(IService_LogHistory logHistoryService)
        {
            _logHistoryService = logHistoryService;
        }

        [HttpGet("GetLogHistory")]
        [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> GetLogHistory()
        {
            var result = await _logHistoryService.GetLogHistory();
            return Ok(result); 
        }

        [HttpGet("GetLogHistoryById")]
        [Authorize]
        public async Task<IActionResult> GetLogHistoryById([FromQuery] Guid userId) 
        {
            var result = await _logHistoryService.GetLogHistoryById(userId);
            return Ok(result);
        }

        [HttpPost("AddLogHistory")]
        [Authorize]
        public async Task<IActionResult> AddLogHistory([FromBody] Request_LogHistory request)
        {
            var result = await _logHistoryService.AddLogHistory(request);
            return Ok(result); 
        }

        [HttpPost("UpdateLogHistory")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateLogHistory([FromBody] Request_LogHistory request, Guid id) 
        {
            var result = await _logHistoryService.UpdateLogHistory(id, request);
            return Ok(result); 
        }

        [HttpDelete("DeleteLogHistory")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteLogHistory(Guid id) 
        {
            var result = await _logHistoryService.DeleteLogHistory(id);
            if (result)
            {
                return Ok(new { Status = 200, Message = "Xóa thành công." });
            }
            return BadRequest(new { Status = 400, Message = "Xóa thất bại hoặc không tìm thấy log." });
        }
        
        [HttpGet("GetLogHistoryDay")]
        [Authorize]
        public async Task<IActionResult> GetLogHistoryDay([FromQuery] int day, [FromQuery] int month, [FromQuery] int year, [FromQuery] Guid userId) // Đổi sang Guid
        {
            var result = await _logHistoryService.GetLogHistoryDay(day, month, year, userId);
            return Ok(result);
        }

        [HttpGet("GetLogHistoryMonth")]
        [Authorize]
        public async Task<IActionResult> GetLogHistoryMonth([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid userId) // Đổi sang Guid
        {
            var result = await _logHistoryService.GetLogHistoryMonth(month, year, userId);
            return Ok(result);
        }

        [HttpGet("GetLogHistoryYear")]
        [Authorize]
        public async Task<IActionResult> GetLogHistoryYear([FromQuery] int year, [FromQuery] Guid userId) // Đổi sang Guid
        {
            var result = await _logHistoryService.GetLogHistoryYear(year, userId);
            return Ok(result);
        }

        
    }
}
