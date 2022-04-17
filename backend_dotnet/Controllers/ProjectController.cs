using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SU_COIN_BACK_END.SU_COIN_INTERFACE;
using SU_COIN_BACK_END.Models;
using SU_COIN_BACK_END.DTOs;
using SU_COIN_BACK_END.Response;

namespace SU_COIN_BACK_END.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpGet("Get/All/{withHex}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllProjects(bool withHex)
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetAllProjects(withHex);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }


        [HttpGet("Get/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProjectByID(int Id)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.GetProjectById(Id);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateProject(ProjectDTO project)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.UpdateProject(project);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }
        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeleteProject(int Id)
        {
            ServiceResponse<bool> response = await _projectService.DeleteProject(Id);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> AddProject(ProjectDTO project)
        {
            ServiceResponse<string> response = await _projectService.AddProject(project);
            Console.WriteLine(response.Message);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut("Rate/{id}/{rating}")]
        public async Task<IActionResult> RateProject(int id, double rating)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.RateProject(id, rating);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }
        [HttpGet("GetPDF/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPdfById(int id)
        {
            ServiceResponse<byte[]> response = await _projectService.GetProjectPdfById(id);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return File(response.Data, "application/pdf", "MyProjectReport.pdf");
        }
        [HttpGet("GetByStatus/{status}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProjectByStatus(string status)
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetProjectsByStatus(status);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }
        [HttpPut("ChangeStatus/{id}")]
        public async Task<IActionResult> ChangeStatus(int id)
        { //Only admin or whitelisted can do it or it can be updated directly from blockchain
            ServiceResponse<ProjectDTO> response = await _projectService.ChangeStatus(id);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }
        [HttpPut("UpdateMarkDown/{id}/{markdown}")]
        public async Task<IActionResult> UpdateMarkDown(int id, string markdown)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.UpdateMarkDown(id, markdown);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("GetAllPermissioned/{withHex}")]
        public async Task<IActionResult> GetAllPermissionedProjects(bool withHex)
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetAllPermissionedProjects(withHex);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("GetAllInvitations/")]
        public async Task<IActionResult> GetAllInvitedProjects()
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetAllInvitedProjects();
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }
    }
}
