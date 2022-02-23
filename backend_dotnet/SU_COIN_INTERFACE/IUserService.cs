using System.Threading.Tasks;
using SU_COIN_BACK_END.Response;
using SU_COIN_BACK_END.DTOs;
using SU_COIN_BACK_END.Request;


namespace SU_COIN_BACK_END.SU_COIN_INTERFACE

{
    public interface IUserService
    {
        Task<ServiceResponse<string>> DeleteUser();
        Task<ServiceResponse<UserDTO>> UpdateUser(UserDTO user);
        Task<ServiceResponse<UserDTO>> GetUser();
        Task<ServiceResponse<string>> GivePermissionToProject(ProjectPermissionRequest request);
        Task<ServiceResponse<string>> EvaluatePendingProjectPermission(ProjectPermissionRequest request);
        Task<ServiceResponse<List<UserDTO>>> GetAllUsers();
        Task<ServiceResponse<string>> RemovePermissionToProject(ProjectPermissionRequest request);
    }
}