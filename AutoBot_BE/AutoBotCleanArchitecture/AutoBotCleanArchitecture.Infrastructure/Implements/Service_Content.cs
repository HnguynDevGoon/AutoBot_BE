using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Content;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Handle;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_Content : IService_Content
    {
        private readonly AppDbContext dbContext;
        private readonly Converter_Content converter_Content;
        private readonly ResponseObject<DTO_Content> responseObject;
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<ResponsePagination<DTO_Content>> responsePagination;

        public Service_Content(
            AppDbContext dbContext,
            Converter_Content converter_Content,
            ResponseObject<DTO_Content> responseObject,
            ResponseBase responseBase,
            ResponseObject<ResponsePagination<DTO_Content>> responsePagination)
        {
            this.dbContext = dbContext;
            this.converter_Content = converter_Content;
            this.responseObject = responseObject;
            this.responseBase = responseBase;
            this.responsePagination = responsePagination;
        }

        public async Task<ResponseObject<ResponsePagination<DTO_Content>>> GetListContent(int pageSize, int pageNumber)
        {
            var query = dbContext.contents.AsQueryable();
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var contents = await query
                .OrderByDescending(x => x.CreatedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var contentDtos = contents.Select(x => converter_Content.EntityToDTO(x)).ToList();

            var paginationData = new ResponsePagination<DTO_Content>
            {
                Items = contentDtos,
                CurrentPage = pageNumber,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            return responsePagination.responseObjectSuccess("Lấy danh sách thành công", paginationData);
        }

        public async Task<ResponseObject<DTO_Content>> GetContentById(Guid id)
        {
            var content = await dbContext.contents.FirstOrDefaultAsync(x => x.Id == id);
            if (content == null) return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy.", null);
            return responseObject.responseObjectSuccess("Thành công.", converter_Content.EntityToDTO(content));
        }

        public async Task<ResponseObject<DTO_Content>> CreateContent(Request_CreateContent request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Title))
                    return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Tiêu đề không được để trống !", null);

                // Xử lý ảnh mặc định nếu FE không gửi link
                string finalUrlAvatar = request.UrlAvatar;
                if (string.IsNullOrEmpty(finalUrlAvatar))
                {
                    finalUrlAvatar = "https://res.cloudinary.com/drpxjqd47/image/upload/v1763051875/xusxceivnufh4ncc8peb.jpg";
                }

                var newContent = new Content
                {
                    Id = Guid.NewGuid(),
                    Title = request.Title,
                    UrlAvatar = finalUrlAvatar, 
                    Link = request.Link,
                    Description = request.Description,
                    CreatedDate = DateTime.UtcNow
                };

                await dbContext.contents.AddAsync(newContent);
                await dbContext.SaveChangesAsync();

                return responseObject.responseObjectSuccess("Tạo bài viết thành công.", converter_Content.EntityToDTO(newContent));
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_Content>> UpdateContent(Request_UpdateContent request)
        {
            try
            {
                var content = await dbContext.contents.FirstOrDefaultAsync(x => x.Id == request.Id);

                if (content == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Nội dung không tồn tại.", null);
                }

                // Cập nhật thông tin chữ
                content.Title = request.Title;
                content.Link = request.Link;
                content.Description = request.Description;

                // LOGIC CẬP NHẬT ẢNH:
                // Nếu FE gửi chuỗi khác null/rỗng lên thì cập nhật, không thì giữ nguyên ảnh cũ
                if (!string.IsNullOrEmpty(request.UrlAvatar))
                {
                    content.UrlAvatar = request.UrlAvatar; // Gán thẳng string
                }

                dbContext.contents.Update(content);
                await dbContext.SaveChangesAsync();

                return responseObject.responseObjectSuccess("Cập nhật thành công.", converter_Content.EntityToDTO(content));
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseBase> DeleteContent(Guid id)
        {
            try
            {
                var content = await dbContext.contents.FirstOrDefaultAsync(x => x.Id == id);
                if (content == null) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy.");

                dbContext.contents.Remove(content);
                await dbContext.SaveChangesAsync();
                return responseBase.ResponseSuccess("Xóa thành công.");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        public async Task<ResponseObject<ResponsePagination<DTO_Content>>> SearchContent(Request_SearchContent request)
        {
            try
            {
                var query = dbContext.contents.AsQueryable();

                if (!string.IsNullOrWhiteSpace(request.Keyword))
                {
                    var keywords = request.Keyword.Trim().ToLower().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

                    foreach (var k in keywords)
                    {
                        query = query.Where(x =>
                            x.Title.ToLower().Contains(k) ||       
                            x.Description.ToLower().Contains(k)    
                        );
                    }
                }

                var totalItems = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalItems / request.PageSize);

                var contents = await query
                    .OrderByDescending(x => x.CreatedDate)
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                var contentDtos = contents.Select(x => converter_Content.EntityToDTO(x)).ToList();

                var paginationData = new ResponsePagination<DTO_Content>
                {
                    Items = contentDtos,
                    CurrentPage = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                if (contentDtos.Count == 0)
                {
                    return responsePagination.responseObjectSuccess("Không tìm thấy bài viết nào phù hợp.", paginationData);
                }

                return responsePagination.responseObjectSuccess("Tìm kiếm bài viết thành công.", paginationData);
            }
            catch (Exception ex)
            {
                return responsePagination.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

    }
}