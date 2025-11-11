using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.User;
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
        public IActionResult CreateUser(Request_CreateUser request)
        {
            return Ok(service_Authen.CreateUser(request));
        }

        [HttpPost("UserLogin")]
        public IActionResult UserLogin(Request_UserLogin request)
        {
            return Ok(service_Authen.UserLogin(request));
        }

        [HttpPut("AccountVerification")]
        public IActionResult AccountVerification(string code)
        {
            return Ok(service_Authen.AccountVerification(code));
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
        public IActionResult DeleteUser(Guid userId)
        {
            return Ok(service_Authen.DeleteUser(userId));
        }

        [HttpPut("UpdateAvatar")]
        public IActionResult UpdateAvatar(Request_UpdateAvatar? request)
        {
            return Ok(service_Authen.UpdateAvatar(request));
        }

        [HttpPut("ChangePassword")]
        public IActionResult ChangePassword(Guid userId, string oldPass, string newPass)
        {
            return Ok(service_Authen.ChangePassword(userId, oldPass, newPass));
        }

        [HttpPost("ForgotPassword")]
        public IActionResult ForgotPassword(string email)
        {
            return Ok(service_Authen.ForgotPassword(email));
        }

        [HttpPut("UpdatePassAfterOtp")]
        public IActionResult UpdatePassAfterOtp(Guid userId, string newPass, string confirmPass)
        {
            return Ok(service_Authen.UpdatePassAfterOtp(userId, newPass, confirmPass));
        }
    }

}
