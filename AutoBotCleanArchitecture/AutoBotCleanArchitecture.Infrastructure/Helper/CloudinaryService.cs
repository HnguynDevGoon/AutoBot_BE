using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;

public class CloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService()
    {
        var account = new Account(
            "drpxjqd47",    //  Cloudinary cloud name
            "455515457272253",       // Cloudinary API key
            "atOeI7luf6Rv177WOZS6GQmdjYo"     //  Cloudinary API secret
        );
        _cloudinary = new Cloudinary(account);
    }

    // Function to delete an image from Cloudinary by public_id
    public async Task<bool> DeleteImage(string publicId)
    {

        var deletionParams = new DeletionParams(publicId);
        var deletionResult = await _cloudinary.DestroyAsync(deletionParams);

        return deletionResult.Result == "ok"; // Returns true if deletion was successful
    }

    // Function to upload a new image from IFormFile and return the secure URL
    public string UploadImage(IFormFile newImage)
    {
        // Convert IFormFile to Stream and upload the image
        using (var stream = newImage.OpenReadStream())
        {
            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(newImage.FileName, stream) // Use stream for the file upload
            };

            var uploadResult = _cloudinary.Upload(uploadParams);
            return uploadResult.SecureUrl.ToString(); // Returns the secure URL of the uploaded image
        }
    }

    // Function to replace an old image with a new one
    public async Task<string> ReplaceImage(string url, IFormFile newImage)
    {
        // Loại bỏ phần base URL và version
        var parts = url.Split(new[] { "image/upload/" }, StringSplitOptions.None);
        if (parts.Length < 2) return null; // Nếu URL không hợp lệ, trả về null

        var publicIdWithExtension = parts[1].Substring(parts[1].IndexOf('/') + 1);

        // Loại bỏ phần mở rộng (.jpg, .png, ...)
        var oldPublicId = publicIdWithExtension.Substring(0, publicIdWithExtension.LastIndexOf('.'));
        // Step 1: Delete the old image
        bool isDeleted = await DeleteImage(oldPublicId);

        if (!isDeleted)
        {
            throw new Exception("Failed to delete the old image from Cloudinary.");
        }

        // Step 2: Upload the new image
        string newImageUrl = UploadImage(newImage);

        return newImageUrl; // Return the URL of the newly uploaded image
    }

}
