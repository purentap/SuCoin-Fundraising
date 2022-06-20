using SU_COIN_BACK_END.Response;
using SU_COIN_BACK_END.Request;
using SU_COIN_BACK_END.DTOs;

namespace SU_COIN_BACK_END.SU_COIN_INTERFACE
{
    public interface IProjectService
    {
        Task<ServiceResponse<ProjectDTO>> GetProjectById(int id);
        Task<ServiceResponse<ProjectDTO>> AddProject(ProjectRequest project);
        Task<ServiceResponse<string>> DeleteProject(int id);
        Task<ServiceResponse<ProjectDTO>> UpdateProject(ProjectDTO project);
        Task<ServiceResponse<ProjectDTO>> RateProject(int id, double rating);
        Task<ServiceResponse<string>> DeleteRatings();
        Task<bool> HasOwnerPermission(int projectID);
        Task<ServiceResponse<List<ProjectDTO>>> GetProjectsByStatus(string status);
        Task<ServiceResponse<ProjectDTO>> ChangeProjectStatus(int id);
        Task<ServiceResponse<ProjectDTO>> UpdateMarkDown(int id, string markdown);
        Task<ServiceResponse<List<ProjectDTO>>> GetAllPermissionedProjects(bool withHex);
        Task<ServiceResponse<List<ProjectDTO>>> GetAllInvitedProjects();
        Task<ServiceResponse<List<ProjectDTO>>> GetProjects(int numberOfProjects = Int32.MaxValue, bool orderByRating = false);
        Task<ServiceResponse<List<ProjectDTO>>> GetProjectsForViewerPage();
        Task<ServiceResponse<List<string?>>> GetAllFileHashes(bool areOnlyAuctionsStarted = true);
        Task<ServiceResponse<string>> ReplyProjectPreview(int id, bool reply);
        Task<ServiceResponse<string>> CreateAuction(int id);
        Task<ServiceResponse<string>> StartAuction(int id);  
    }
}