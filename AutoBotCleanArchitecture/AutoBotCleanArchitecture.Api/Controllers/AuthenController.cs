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

        //[HttpPost("CheckOtp")]
        //public IActionResult CheckOtp(int otp)
        //{
        //    return Ok(service_Authen.CheckOtp(otp));
        //}

        [HttpPut("AccountVerification")]
        public IActionResult AccountVerification(string code)
        {
            return Ok(service_Authen.AccountVerification(code));
        }
    }

}
