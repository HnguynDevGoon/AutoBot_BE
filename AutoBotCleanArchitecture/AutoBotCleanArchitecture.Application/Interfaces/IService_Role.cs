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
        public ResponseBase CreateRole(Request_CreateRole request);
        public ResponseObject<DTO_Role> UpdateRole(Request_UpdateRole request);
        public IQueryable<DTO_Role> GetListRole(int pageSize, int pageNumber);
        public ResponseObject<DTO_Role> GetRoleById(Guid roleId);
        public ResponseObject<DTO_Role> DeleteRole(Guid roleId);
    }
}
