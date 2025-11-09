using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Responses
{
    public class ResponseToken
    {
        public string TokenType { get; set; } = "Bearer";
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public DateTime ExpireDate { get; set; }
    }
}
