using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Review;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IService_Review service_Review;

        public ReviewController(IService_Review service_Review)
        {
            this.service_Review = service_Review;
        }

        [HttpGet("GetAllReviews")]
        public async Task<IActionResult> GetAllReviews()
        {
            return Ok(await service_Review.GetAllReviews());
        }

        [HttpGet("GetReviewById")]
        public async Task<IActionResult> GetReviewById(Guid id)
        {
            return Ok(await service_Review.GetReviewById(id));
        }

        [HttpPost("CreateReview")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateReview(Request_CreateReview request)
        {
            return Ok(await service_Review.CreateReview(request));
        }

        [HttpPut("UpdateReview")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateReview(Request_UpdateReview request)
        {
            return Ok(await service_Review.UpdateReview(request));
        }

        [HttpDelete("DeleteReview")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteReview(Guid id)
        {
            return Ok(await service_Review.DeleteReview(id));
        }
    }
}