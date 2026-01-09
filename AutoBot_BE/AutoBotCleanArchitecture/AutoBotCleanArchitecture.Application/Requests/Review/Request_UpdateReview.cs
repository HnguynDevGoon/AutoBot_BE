using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.Review
{
    public class Request_UpdateReview
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string UrlAvatar { get; set; }
        public string Description { get; set; }
        public int Rate { get; set; }
    }
}
