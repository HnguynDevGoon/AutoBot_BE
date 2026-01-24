using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Salary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalaryController : ControllerBase
    {
        private readonly IService_Salary service_Salary;

        public SalaryController(IService_Salary service_Salary)
        {
            this.service_Salary = service_Salary;
        }

        [HttpGet("GetSalaries")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSalaries(int pageNumber = 1, int pageSize = 10)
        {
            return Ok(await service_Salary.GetSalaries(pageNumber, pageSize));
        }

        [HttpPost("AddSalary")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddSalary(Request_AddSalary request)
        {
            return Ok(await service_Salary.AddSalary(request));
        }

        [HttpPut("UpdateSalary")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSalary(Request_UpdateSalary request)
        {
            return Ok(await service_Salary.UpdateSalary(request));
        }

        [HttpDelete("DeleteSalary")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSalary(Guid userId)
        {
            return Ok(await service_Salary.DeleteSalary(userId));
        }


        [HttpGet("GetSalaryByMonth")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSalaryByMonth(int month, int year)
        {
            return Ok(await service_Salary.GetSalaryByMonth(month, year));
        }

        [HttpGet("GetSalaryByYear")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSalaryByYear(int year)
        {
            return Ok(await service_Salary.GetSalaryByYear(year));
        }

        [HttpGet("GetSalaryDate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSalaryDate(DateTime from, DateTime to)
        {
            return Ok(await service_Salary.GetSalaryDate(from, to));
        }
    }
}