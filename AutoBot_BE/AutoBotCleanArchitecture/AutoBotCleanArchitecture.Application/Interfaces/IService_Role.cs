using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.Role;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Role
    {
        Task<ResponseBase> CreateRole(Request_CreateRole request);
        Task<ResponseObject<DTO_Role>> DeleteRole(Guid roleId);
        Task<List<DTO_Role>> GetListRole(int pageSize, int pageNumber);
        Task<ResponseObject<DTO_Role>> GetRoleById(Guid roleId);
        Task<ResponseObject<DTO_Role>> UpdateRole(Request_UpdateRole request);
    }
}
