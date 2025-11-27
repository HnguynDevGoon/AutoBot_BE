using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_Content
    {
        public DTO_Content EntityToDTO(Content content)
        {
            return new DTO_Content
            {
                Id = content.Id,
                Title = content.Title,
                Description = content.Description,
                Link = content.Link,    
                UrlAvatar = content.UrlAvatar,  
                CreatedDate = content.CreatedDate,
            };
        }
    }
}
