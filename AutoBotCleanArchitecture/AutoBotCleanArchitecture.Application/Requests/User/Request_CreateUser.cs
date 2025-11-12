using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.User
{
    public class Request_CreateUser
    {
        public string UserName { get; set; }
        public string PassWord { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateOnly? BirthDay { get; set; }
        public IFormFile? UrlAvatar { get; set; }
    }
}
