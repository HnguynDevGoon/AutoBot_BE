using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests;
using AutoBotCleanArchitecture.Application.Requests.OtherContent;
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
    public class Service_OtherContent : IService_OtherContent
    {
        private readonly AppDbContext dbContext;
        private readonly Converter_OtherContent converter_OtherContent;
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<DTO_OtherContent> responseObject;
        private readonly ResponseObject<List<DTO_OtherContent>> responseObjectList;

        public Service_OtherContent(AppDbContext dbContext, Converter_OtherContent converter_OtherContent, ResponseBase responseBase, ResponseObject<DTO_OtherContent> responseObject, ResponseObject<List<DTO_OtherContent>> responseObjectList)
        {
            this.dbContext = dbContext;
            this.converter_OtherContent = converter_OtherContent;
            this.responseBase = responseBase;
            this.responseObject = responseObject;
            this.responseObjectList = responseObjectList;
        }

        // GET BY OTHER TYPE - Lấy theo OtherType (Gần đúng)
        public async Task<ResponseObject<List<DTO_OtherContent>>> GetByOtherType(string otherType)
        {
            try
            {
                if (string.IsNullOrEmpty(otherType))
                {
                    return responseObjectList.responseObjectSuccess("Danh sách rỗng", new List<DTO_OtherContent>());
                }

                var otherContents = await dbContext.otherContents
                    .Where(x => x.OtherType.Contains(otherType))
                    .ToListAsync();

                var dtoList = otherContents.Select(x => converter_OtherContent.EntityToDTO(x)).ToList();

                return responseObjectList.responseObjectSuccess("Lấy danh sách thành công", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // GET BY ID
        public async Task<ResponseObject<DTO_OtherContent>> GetOtherContentById(Guid id)
        {
            try
            {
                var otherContent = await dbContext.otherContents.FindAsync(id);
                if (otherContent == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy", null);
                }

                var dto = converter_OtherContent.EntityToDTO(otherContent);
                return responseObject.responseObjectSuccess("Lấy dữ liệu thành công", dto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // CREATE
        public async Task<ResponseObject<DTO_OtherContent>> CreateOtherContent(Request_CreateOtherContent request)
        {
            try
            {
                var entity = new OtherContent
                {
                    Title = request.Title,
                    Description = request.Description,
                    Icon = request.Icon,
                    OtherType = request.OtherType
                };

                await dbContext.otherContents.AddAsync(entity);
                await dbContext.SaveChangesAsync();

                var dto = converter_OtherContent.EntityToDTO(entity);
                return responseObject.responseObjectSuccess("Tạo mới thành công", dto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // UPDATE
        public async Task<ResponseObject<DTO_OtherContent>> UpdateCreateOtherContent(Request_UpdateOtherContent request)
        {
            try
            {
                var existingEntity = await dbContext.otherContents.FindAsync(request.Id);
                if (existingEntity == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy", null);
                }

                existingEntity.Title = request.Title;
                existingEntity.Description = request.Description;
                existingEntity.Icon = request.Icon;
                existingEntity.OtherType = request.OtherType;

                dbContext.otherContents.Update(existingEntity);
                await dbContext.SaveChangesAsync();

                var dto = converter_OtherContent.EntityToDTO(existingEntity);
                return responseObject.responseObjectSuccess("Cập nhật thành công", dto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // DELETE
        public async Task<ResponseBase> DeleteOtherContent(Guid id)
        {
            try
            {
                var entity = await dbContext.otherContents.FindAsync(id);
                if (entity == null)
                {
                    return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy");
                }

                dbContext.otherContents.Remove(entity);
                await dbContext.SaveChangesAsync();

                return responseBase.ResponseSuccess("Xóa thành công");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }
    }
}