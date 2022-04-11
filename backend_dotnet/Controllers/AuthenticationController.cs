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
    [ApiController]
    [Route("[controller]")]
    public class AuthenticationController: ControllerBase
    {       
        private readonly IAuthencticationService _authenticationService;
        public AuthenticationController(IAuthencticationService authencticationService){
            _authenticationService = authencticationService;
        }

        [HttpPost("Login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(UserLoginRequest request){
            ServiceResponse<string> response = await _authenticationService.Login(request);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        } 

        [HttpPut("Register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(UserRegisterRequest request){
            ServiceResponse<string> response = await _authenticationService.Register(request);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("GetNonce/{address}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNonce(string address){
            ServiceResponse<int> response = await _authenticationService.GetNonce(address);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        } 
    }      
}