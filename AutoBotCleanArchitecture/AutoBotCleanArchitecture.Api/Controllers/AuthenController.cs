using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
        public IActionResult CreateUser([FromForm] Request_CreateUser request)
        {
            return Ok(service_Authen.CreateUser(request));
        }

        [HttpPost("UserLogin")]
        public IActionResult UserLogin(Request_UserLogin request)
        {
            return Ok(service_Authen.UserLogin(request));
        }

        [HttpPost("AccountVerification")]
        public IActionResult AccountVerification(Request_AccountVerification request)
        {
            return Ok(service_Authen.AccountVerification(request));
        }

        [HttpGet("GetListUser")]
        public IActionResult GetListUser(int pageSize = 10, int pageNumber = 1)
        {
            return Ok(service_Authen.GetListUser(pageSize, pageNumber));
        }

        [HttpGet("GetUserById")]
        public IActionResult GetUserById(Guid userId)
        {
            return Ok(service_Authen.GetUserById(userId));
        }

        [HttpDelete("DeleteUser")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeleteUser(Guid userId)
        {
            return Ok(service_Authen.DeleteUser(userId));
        }

        [HttpPost("UpdateAvatar")]
        [Authorize(Roles = "Admin,User")]
        public IActionResult UpdateAvatar(Request_UpdateAvatar? request)
        {
            return Ok(service_Authen.UpdateAvatar(request));
        }

        [HttpPost("ChangePassword")]
        [Authorize(Roles = "Admin,User")]
        public IActionResult ChangePassword(Request_ChangePassword request)
        {
            return Ok(service_Authen.ChangePassword(request));
        }

        [HttpPost("ForgotPassword")]
        public IActionResult ForgotPassword(Request_ForgotPassword request)
        {
            return Ok(service_Authen.ForgotPassword(request));
        }

        [HttpPost("UpdatePassAfterOtp")]
        public IActionResult UpdatePassAfterOtp(Request_UpdatePassAfterOtp request)
        {
            return Ok(service_Authen.UpdatePassAfterOtp(request));
        }

        [HttpPost("VerifyResetOtp")]
        public IActionResult VerifyResetOtp(Request_VerifyResetOtp request)
        {
            return Ok(service_Authen.VerifyResetOtp(request));  
        }

        [HttpPost("VerifyTwoStep")]
        public IActionResult VerifyTwoStep(Request_VerifyTwoStep request)
        {
            return Ok(service_Authen.VerifyTwoStep(request));
        }

        [HttpPost("ValidateAccountStepOne")]
        public IActionResult Request_ValidateAccountStepOne(Request_ValidateAccountStepOne request)
        {
            return Ok(service_Authen.ValidateAccountStepOne(request));
        }
    }

}
