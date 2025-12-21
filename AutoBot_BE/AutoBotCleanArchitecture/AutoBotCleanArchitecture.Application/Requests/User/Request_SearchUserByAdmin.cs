using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.User
{
    public class Request_SearchUserByAdmin
    {
        public string? Keyword { get; set; } = ""; // Tìm theo Tên, Email, SDT, Username

        public bool? IsActive { get; set; } = null;
        public bool? IsLock { get; set; } = null;
        public string? RoleName { get; set; } = "";

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
