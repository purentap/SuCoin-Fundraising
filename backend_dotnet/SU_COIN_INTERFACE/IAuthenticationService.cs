using System.Threading.Tasks;
using SU_COIN_BACK_END.Request;
using SU_COIN_BACK_END.Response;

namespace SU_COIN_BACK_END.SU_COIN_INTERFACE{   
    public interface IAuthencticationService{
        Task<ServiceResponse<string>> Register(UserRegisterRequest request);
        Task<ServiceResponse<string>> Login(UserLoginRequest request);
        Task<ServiceResponse<int>> GetNonce(string address);
        Task<bool> UserNameExists(string username);
    } 
}