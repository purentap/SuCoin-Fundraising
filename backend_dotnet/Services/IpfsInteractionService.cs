using SU_COIN_BACK_END.SU_COIN_INTERFACE;
using Newtonsoft.Json;
using SU_COIN_BACK_END.Response;
using SU_COIN_BACK_END.Constants.MessageConstants;

namespace SU_COIN_BACK_END.Services
{
    public class IpfsInteractionService : IIpfsInteractionService
    {
        public async Task<ServiceResponse<string>> UploadToIpfs(string hexString,string? imageHex)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();

            string actionUrl = "https://ipfs.infura.io:5001/api/v0/add?wrap-with-directory";
            byte[] paramFileBytes = Convert.FromHexString(hexString);
            byte[] paramImageBytes = Convert.FromHexString(imageHex);

   
            HttpContent bytesContent = new ByteArrayContent(paramFileBytes);
            HttpContent imageContent = new ByteArrayContent(paramImageBytes);
            try
            {
                using (var client = new HttpClient())
                using (var formData = new MultipartFormDataContent())
                {
                    client.DefaultRequestHeaders.Add("Authorization", "Basic MjlJOTJHRHRBR0RaenpZNnNUWUdLdkRXeFdROjg1NTNmOTkwZWE3Nzk3ODVjY2Q2NjVkMjU2NDY2MWZi");
                    formData.Add(bytesContent, "file", "whitepaper");

                    if (imageHex != null)
                    {
                        formData.Add(imageContent,"file","image");
                    }
                        
                    var ipfsResponse = await client.PostAsync(actionUrl, formData);
                    if (!ipfsResponse.IsSuccessStatusCode)
                    {
                        throw new Exception("Status code is not success");
                    }

                    string stringResponse = (await ipfsResponse.Content.ReadAsStringAsync()).Split('\n').SkipLast(1).Last();
                    var uploadResult = JsonConvert.DeserializeObject<Dictionary<string, string>>(stringResponse);
                    Console.WriteLine($"Upload Result: {uploadResult}"); // Debuging

                    var hash = uploadResult?["Hash"];
                    
                    if (hash == null)
                    {
                        throw new Exception("Hash is null");
                    }
                    
                    response.Success = true;
                    response.Data = hash;
                    response.Message = MessageConstants.OK;
                }
            }
            catch (Exception)
            {
                response.Message = MessageConstants.IPFS_INTERACTION_FAIL;
            }
            return response;
        }
        public async Task<ServiceResponse<bool>> RemoveFromIpfs(string encodedHash)
        {
            ServiceResponse<bool> response = new ServiceResponse<bool>();

            string actionUrl = "https://ipfs.infura.io:5001/api/v0/pin/rm?arg=" + encodedHash;
            Console.WriteLine(actionUrl);

            using (var client = new HttpClient())
            using (var formData = new MultipartFormDataContent())
            {
                client.DefaultRequestHeaders.Add("Authorization", "Basic MjlJOTJHRHRBR0RaenpZNnNUWUdLdkRXeFdROjg1NTNmOTkwZWE3Nzk3ODVjY2Q2NjVkMjU2NDY2MWZi");
                var ipfsResponse = await client.PostAsync(actionUrl, formData);

                if (ipfsResponse.IsSuccessStatusCode) 
                {
                    response.Success = true;
                    response.Data = true;
                    response.Message = MessageConstants.OK;
                }
                else 
                {
                    response.Message = MessageConstants.IPFS_INTERACTION_FAIL;
                }
                return response;
            }
        }   
    }
}