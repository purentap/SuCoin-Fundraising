using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SU_COIN_BACK_END.Response;

namespace SU_COIN_BACK_END.SU_COIN_INTERFACE
{
    public interface IIpfsInteractionService
    {
        Task<ServiceResponse<string>> UploadToIpfs(string hexString, string?imageHex);
        Task<ServiceResponse<bool>> RemoveFromIpfs(string encodedHash);

    }
}