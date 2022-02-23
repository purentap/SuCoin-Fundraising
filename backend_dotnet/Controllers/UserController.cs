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
using SU_COIN_BACK_END.Request;

namespace SU_COIN_BACK_END.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class UserController: ControllerBase
    { 
        private readonly IUserService _userInterface;

        public UserController(IUserService userInterface)
        {
            _userInterface = userInterface;
        }

        [HttpGet("Get")]
        public async Task<IActionResult> Get(){ //might also deliver the permission not only invitations
            ServiceResponse<UserDTO> response = await _userInterface.GetUser();
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        } 

        [HttpPost("Update")]
        public async Task<IActionResult> UpdateUser(UserDTO request){
            ServiceResponse<UserDTO> response = await _userInterface.UpdateUser(request);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        } 

        [HttpDelete("Delete")]
        public async Task<IActionResult> DeleteUser(){
            ServiceResponse<string> response = await _userInterface.DeleteUser();
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        } 

        [HttpPut("Invite")]
        public async Task<IActionResult> InviteToProject(ProjectPermissionRequest request){
            ServiceResponse<string> response = await _userInterface.GivePermissionToProject(request);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        } 

        [HttpPost("InvitationReply")]
        public async Task<IActionResult> ProjectInvitationReply(ProjectPermissionRequest request){
            ServiceResponse<string> response = await _userInterface.EvaluatePendingProjectPermission(request);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllUsers(){ //Only for admin
            ServiceResponse<List<UserDTO>> response = await _userInterface.GetAllUsers();
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpDelete("RemoveCollab")]
        public async Task<IActionResult> RemoveCollab(ProjectPermissionRequest request){
            ServiceResponse<string> response = await _userInterface.RemovePermissionToProject(request);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }
    }
}