using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.Review;
using AutoBotCleanArchitecture.Application.Responses;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Review
    {
        Task<ResponseObject<List<DTO_Review>>> GetAllReviews();
        Task<ResponseObject<DTO_Review>> GetReviewById(Guid id);
        Task<ResponseObject<DTO_Review>> CreateReview(Request_CreateReview request);
        Task<ResponseObject<DTO_Review>> UpdateReview(Request_UpdateReview request);
        Task<ResponseBase> DeleteReview(Guid id);
    }
}