using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.User
{
    public class Request_GoogleLogin
    {
        // Frontend sẽ gửi idToken lấy từ Google lên đây
        public string IdToken { get; set; }
    }
}
