using System.Threading.Tasks;
using SU_COIN_BACK_END.Response;
using SU_COIN_BACK_END.Models;
using System.Collections.Generic;
using SU_COIN_BACK_END.DTOs;

namespace SU_COIN_BACK_END.SU_COIN_INTERFACE
{
    public interface IProjectService
    {
         Task<ServiceResponse<List<ProjectDTO>>> GetAllProjects();
         Task<ServiceResponse<ProjectDTO>> GetProjectById(int ID);
         Task<ServiceResponse<string>> AddProject(ProjectDTO project);
         Task<ServiceResponse<bool>> DeleteProject(int ID);
         Task<ServiceResponse<ProjectDTO>> UpdateProject(ProjectDTO project);
         Task<ServiceResponse<ProjectDTO>> RateProject(int id, double rating);
         Task<ServiceResponse<byte[]>> GetProjectPdfById(int projectID);
         Task<ServiceResponse<List<ProjectDTO>>> GetProjectsByStatus(string status);
         Task<ServiceResponse<ProjectDTO>> ChangeStatus(int id);
         Task<ServiceResponse<ProjectDTO>> UpdateMarkDown(int id, string markdown);
         Task<ServiceResponse<List<ProjectDTO>>> GetAllPermissionedProjects();

    }
}