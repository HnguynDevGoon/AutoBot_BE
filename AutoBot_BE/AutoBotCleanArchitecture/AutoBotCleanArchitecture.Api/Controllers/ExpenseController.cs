using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Expense;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExpenseController : ControllerBase
    {
        private readonly IService_Expense service_Expense;

        public ExpenseController(IService_Expense service_Expense)
        {
            this.service_Expense = service_Expense;
        }

        [HttpGet("GetExpenses")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetExpenses(int pageNumber = 1, int pageSize = 10)
        {
            return Ok(await service_Expense.GetExpenses(pageNumber, pageSize));
        }

        [HttpPost("AddExpense")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddExpense(Request_AddExpense request)
        {
            return Ok(await service_Expense.AddExpense(request));
        }

        [HttpPut("UpdateExpense")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateExpense(Request_UpdateExpense request)
        {
            return Ok(await service_Expense.UpdateExpense(request));
        }

        [HttpDelete("DeleteExpense")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteExpense(Guid id)
        {
            return Ok(await service_Expense.DeleteExpense(id));
        }

        [HttpGet("GetExpenseByDate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetExpenseByDate(int day, int month, int year)
        {
            return Ok(await service_Expense.GetExpenseByDate(day, month, year));
        }

        [HttpGet("GetExpenseByMonth")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetExpenseByMonth(int month, int year)
        {
            return Ok(await service_Expense.GetExpenseByMonth(month, year));
        }

        [HttpGet("GetExpenseByYear")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetExpenseByYear(int year)
        {
            return Ok(await service_Expense.GetExpenseByYear(year));
        }

        [HttpGet("GetExpenseDate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetExpenseDate(DateTime from, DateTime to)
        {
            return Ok(await service_Expense.GetExpenseDate(from, to));
        }
    }
}