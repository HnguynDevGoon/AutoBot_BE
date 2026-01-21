using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.LogHistory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;

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

        // -----------------------------
        // Compat endpoints (match older frontend paths)
        // Frontend_Autobot currently calls:
        //   GET  /api/logHistory/getAll
        //   POST /api/logHistory/add
        //   GET  /api/logHistory/getLogHistoryDay|Month|Year
        // and expects { logHistory: [...], countSL } or { logHistoryList: [...], countSL }.
        // -----------------------------

        [HttpGet("/api/logHistory/getAll")]
        [AllowAnonymous]
        public async Task<IActionResult> Compat_GetAll()
        {
            var result = await _logHistoryService.GetLogHistory();
            var list = result?.Data ?? [];
            var countSL = list.Count(x => x.IsSL);
            return Ok(new { logHistory = list, countSL });
        }

        [HttpPost("/api/logHistory/add")]
        [Authorize]
        public async Task<IActionResult> Compat_Add([FromBody] Request_LogHistory request)
        {
            var result = await _logHistoryService.AddLogHistory(request);
            return Ok(result);
        }

        [HttpGet("/api/logHistory/getLogHistoryDay")]
        [Authorize]
        public async Task<IActionResult> Compat_GetDay([FromQuery] int day, [FromQuery] int month, [FromQuery] int year, [FromQuery] string userId)
        {
            if (!Guid.TryParse(userId, out var uid))
            {
                return BadRequest("userId must be a GUID");
            }
            var result = await _logHistoryService.GetLogHistoryDay(day, month, year, uid);
            var list = result?.Data ?? [];
            var countSL = list.Count(x => x.IsSL);
            return Ok(new { logHistoryList = list, countSL });
        }

        [HttpGet("/api/logHistory/getLogHistoryMonth")]
        [Authorize]
        public async Task<IActionResult> Compat_GetMonth([FromQuery] int month, [FromQuery] int year, [FromQuery] string userId)
        {
            if (!Guid.TryParse(userId, out var uid))
            {
                return BadRequest("userId must be a GUID");
            }
            var result = await _logHistoryService.GetLogHistoryMonth(month, year, uid);
            var list = result?.Data ?? [];
            var countSL = list.Count(x => x.IsSL);
            return Ok(new { logHistoryList = list, countSL });
        }

        [HttpGet("/api/logHistory/getLogHistoryYear")]
        [Authorize]
        public async Task<IActionResult> Compat_GetYear([FromQuery] int year, [FromQuery] string userId)
        {
            if (!Guid.TryParse(userId, out var uid))
            {
                return BadRequest("userId must be a GUID");
            }
            var result = await _logHistoryService.GetLogHistoryYear(year, uid);
            var list = result?.Data ?? [];
            var countSL = list.Count(x => x.IsSL);
            return Ok(new { logHistoryList = list, countSL });
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
        public async Task<IActionResult> GetLogHistoryDay([FromQuery] int day, [FromQuery] int month, [FromQuery] int year, [FromQuery] Guid userId) 
        {
            var result = await _logHistoryService.GetLogHistoryDay(day, month, year, userId);
            return Ok(result);
        }

        [HttpGet("GetLogHistoryMonth")]
        [Authorize]
        public async Task<IActionResult> GetLogHistoryMonth([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid userId) 
        {
            var result = await _logHistoryService.GetLogHistoryMonth(month, year, userId);
            return Ok(result);
        }

        [HttpGet("GetLogHistoryYear")]
        [Authorize]
        public async Task<IActionResult> GetLogHistoryYear([FromQuery] int year, [FromQuery] Guid userId) 
        {
            var result = await _logHistoryService.GetLogHistoryYear(year, userId);
            return Ok(result);
        }


    }
}
