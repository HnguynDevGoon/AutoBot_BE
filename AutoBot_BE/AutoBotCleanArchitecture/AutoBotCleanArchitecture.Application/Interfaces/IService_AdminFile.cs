using AutoBotCleanArchitecture.Application.Requests.AdminFile;
using AutoBotCleanArchitecture.Application.Responses;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_AdminFile
    {
        Task<ResponseObject<string>> AddSignal(Request_AddSignal request);
        Task<ResponseObject<string>> UploadScriptAsync(IFormFile file);
        Task<ResponseObject<string>> UploadExtensionAsync(IFormFile file);
        Task<ResponseObject<string>> GetScriptContentAsync();
    }
}
