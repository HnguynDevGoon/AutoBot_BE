using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Role;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_Role : IService_Role
    {
        private readonly AppDbContext dbContext;
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<DTO_Role> responseObject;
        private readonly Converter_Role converter_Role;

        public Service_Role(AppDbContext dbContext, ResponseBase responseBase, ResponseObject<DTO_Role> responseObject, Converter_Role converter_Role)
        {
            this.dbContext = dbContext;
            this.responseBase = responseBase;
            this.responseObject = responseObject;
            this.converter_Role = converter_Role;
        }

        // 1. CreateRole
        public async Task<ResponseBase> CreateRole(Request_CreateRole request)
        {
            var role = new Role()
            {
                RoleName = request.RoleName,
            };

            await dbContext.roles.AddAsync(role);
            await dbContext.SaveChangesAsync();

            return responseBase.ResponseSuccess("Thêm quyền thành công !");
        }

        // 2. DeleteRole
        public async Task<ResponseObject<DTO_Role>> DeleteRole(Guid roleId)
        {
            var role = await dbContext.roles.FirstOrDefaultAsync(r => r.Id == roleId);

            if (role == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Role không tồn tại.", null);
            }

            dbContext.roles.Remove(role);

            await dbContext.SaveChangesAsync();
            return responseObject.responseObjectSuccess("Xóa thành công !", null);
        }

        // 3. GetListRole
        public async Task<List<DTO_Role>> GetListRole(int pageSize, int pageNumber)
        {
            return await dbContext.roles
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(x => converter_Role.EntityToDTO(x))
                .ToListAsync();
        }

        // 4. GetRoleById
        public async Task<ResponseObject<DTO_Role>> GetRoleById(Guid roleId)
        {
            var role = await dbContext.roles.FirstOrDefaultAsync(r => r.Id == roleId);

            if (role == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Role không tồn tại.", null);
            }

            var roleDto = converter_Role.EntityToDTO(role);

            return responseObject.responseObjectSuccess("Lấy thông tin role thành công.", roleDto);
        }

        // 5. UpdateRole
        public async Task<ResponseObject<DTO_Role>> UpdateRole(Request_UpdateRole request)
        {
            var role = await dbContext.roles.FirstOrDefaultAsync(x => x.Id == request.Id);

            if (role == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy !", null);
            }

            role.RoleName = request.RoleName;

            dbContext.roles.Update(role);
            await dbContext.SaveChangesAsync();

            return responseObject.responseObjectSuccess("Sửa thành công !", converter_Role.EntityToDTO(role));
        }

    }
}
