using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System; 
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenController : ControllerBase
    {
        private readonly IService_Authen service_Authen;

        public AuthenController(IService_Authen service_Authen)
        {
            this.service_Authen = service_Authen;
        }

        [HttpPost("CreateUser")]
        public async Task<IActionResult> CreateUser([FromForm] Request_CreateUser request)
        {
            return Ok(await service_Authen.CreateUser(request));
        }

        [HttpPost("UserLogin")]
        public async Task<IActionResult> UserLogin(Request_UserLogin request) 
        {
            return Ok(await service_Authen.UserLogin(request));
        }

        [HttpPost("AccountVerification")]
        public async Task<IActionResult> AccountVerification(Request_AccountVerification request) 
        {
            return Ok(await service_Authen.AccountVerification(request));
        }

        [HttpGet("GetListUser")]
        public IActionResult GetListUser(int pageSize = 10, int pageNumber = 1)
        {
            return Ok(service_Authen.GetListUser(pageSize, pageNumber));
        }

        [HttpGet("GetUserById")]
        public async Task<IActionResult> GetUserById(Guid userId)
        {
            return Ok(await service_Authen.GetUserById(userId));
        }

        [HttpDelete("DeleteUser")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(Guid userId) 
        {
            return Ok(await service_Authen.DeleteUser(userId));
        }

        [HttpPost("UpdateAvatar")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> UpdateAvatar(Request_UpdateAvatar? request)
        {
            return Ok(await service_Authen.UpdateAvatar(request));
        }

        [HttpPost("ChangePassword")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> ChangePassword(Request_ChangePassword request) 
        {
            return Ok(await service_Authen.ChangePassword(request));
        }

        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword(Request_ForgotPassword request) 
        {
            return Ok(await service_Authen.ForgotPassword(request));
        }

        [HttpPost("UpdatePassAfterOtp")]
        public async Task<IActionResult> UpdatePassAfterOtp(Request_UpdatePassAfterOtp request) 
        {
            return Ok(await service_Authen.UpdatePassAfterOtp(request));
        }

        [HttpPost("VerifyResetOtp")]
        public async Task<IActionResult> VerifyResetOtp(Request_VerifyResetOtp request) 
        {
            return Ok(await service_Authen.VerifyResetOtp(request));
        }

        [HttpPost("VerifyTwoStep")]
        public async Task<IActionResult> VerifyTwoStep(Request_VerifyTwoStep request) 
        {
            return Ok(await service_Authen.VerifyTwoStep(request));
        }

        [HttpPost("ValidateAccountStepOne")]
        public async Task<IActionResult> Request_ValidateAccountStepOne(Request_ValidateAccountStepOne request)
        {
            return Ok(await service_Authen.ValidateAccountStepOne(request));
        }

        [HttpPost("GoogleLogin")]
        public async Task<IActionResult> GoogleLogin(Request_GoogleLogin request)
        {
            return Ok(await service_Authen.GoogleLogin(request));
        }

        [HttpPost("FacebookLogin")]
        public async Task<IActionResult> FacebookLogin(Request_FacebookLogin request)
        {
            return Ok(await service_Authen.FacebookLogin(request));
        }
    }

}