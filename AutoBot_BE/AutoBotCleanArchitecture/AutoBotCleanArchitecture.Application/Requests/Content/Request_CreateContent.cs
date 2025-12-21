using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.Content
{
    public class Request_CreateContent
    {
        public string Title { get; set; }
        public string? UrlAvatar { get; set; }
        public string? Link { get; set; }
        public string Description { get; set; }
    }
}
