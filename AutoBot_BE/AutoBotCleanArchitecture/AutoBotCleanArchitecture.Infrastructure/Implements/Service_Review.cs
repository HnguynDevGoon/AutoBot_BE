using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Review; // Nhớ using cái Request vừa tạo
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_Review : IService_Review
    {
        private readonly AppDbContext dbContext;
        private readonly Converter_Review converter_Review; 
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<DTO_Review> responseObject;
        private readonly ResponseObject<List<DTO_Review>> responseObjectList;

        public Service_Review(
            AppDbContext dbContext,
            Converter_Review converter_Review,
            ResponseBase responseBase,
            ResponseObject<DTO_Review> responseObject,
            ResponseObject<List<DTO_Review>> responseObjectList)
        {
            this.dbContext = dbContext;
            this.converter_Review = converter_Review;
            this.responseBase = responseBase;
            this.responseObject = responseObject;
            this.responseObjectList = responseObjectList;
        }

        // 1. GET ALL (Lấy hết, không phân trang)
        public async Task<ResponseObject<List<DTO_Review>>> GetAllReviews()
        {
            try
            {
                var list = await dbContext.reviews // Giả sử trong DbContext ông đặt tên là reviews
                    .OrderByDescending(x => x.Rate) // Sắp xếp theo đánh giá cao nhất (tùy ông)
                    .ToListAsync();

                var dtos = list.Select(x => converter_Review.EntityToDTO(x)).ToList();

                return responseObjectList.responseObjectSuccess("Lấy danh sách đánh giá thành công.", dtos);
            }
            catch (Exception ex)
            {
                return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 2. GET BY ID (Lấy chi tiết 1 cái)
        public async Task<ResponseObject<DTO_Review>> GetReviewById(Guid id)
        {
            try
            {
                var review = await dbContext.reviews.FindAsync(id);
                if (review == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy đánh giá này.", null);
                }

                return responseObject.responseObjectSuccess("Tìm thấy.", converter_Review.EntityToDTO(review));
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 3. CREATE (Tạo mới - Push)
        public async Task<ResponseObject<DTO_Review>> CreateReview(Request_CreateReview request)
        {
            try
            {
                var review = new Review
                {
                    FullName = request.FullName,
                    UrlAvatar = request.UrlAvatar,
                    Rate = request.Rate
                };

                await dbContext.reviews.AddAsync(review);
                await dbContext.SaveChangesAsync();

                return responseObject.responseObjectSuccess("Thêm đánh giá thành công.", converter_Review.EntityToDTO(review));
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 4. UPDATE (Cập nhật - Post/Put)
        public async Task<ResponseObject<DTO_Review>> UpdateReview(Request_UpdateReview request)
        {
            try
            {
                var review = await dbContext.reviews.FindAsync(request.Id);
                if (review == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy để cập nhật.", null);
                }

                // Cập nhật dữ liệu
                review.FullName = request.FullName;
                review.UrlAvatar = request.UrlAvatar;
                review.Rate = request.Rate;

                dbContext.reviews.Update(review);
                await dbContext.SaveChangesAsync();

                return responseObject.responseObjectSuccess("Cập nhật thành công.", converter_Review.EntityToDTO(review));
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 5. DELETE (Xóa)
        public async Task<ResponseBase> DeleteReview(Guid id)
        {
            try
            {
                var review = await dbContext.reviews.FindAsync(id);
                if (review == null)
                {
                    return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy đánh giá để xóa.");
                }

                dbContext.reviews.Remove(review);
                await dbContext.SaveChangesAsync();

                return responseBase.ResponseSuccess("Xóa thành công.");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }
    }
}