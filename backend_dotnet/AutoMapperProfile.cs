using System.Linq;
using AutoMapper;
using SU_COIN_BACK_END.Models;
using SU_COIN_BACK_END.DTOs;

namespace SU_COIN_BACK_END
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile(){
            CreateMap<Project, ProjectDTO>();
            CreateMap<ProjectDTO, Project>();
            CreateMap<User, UserDTO>();
            CreateMap<UserDTO, User>();
        }
    }
}