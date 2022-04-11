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
using Nethereum.Contracts;

namespace SU_COIN_BACK_END.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class EventDebugController: ControllerBase
    {       
        private readonly IChainInteractionService _chainInteractionService;
        public EventDebugController(IChainInteractionService chainInteractionService){
            _chainInteractionService = chainInteractionService;
        }

        [HttpGet("Debug")]
        public async Task<IActionResult> Debug() {
            ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>> response = await _chainInteractionService.GetProjectEvaluationEventLogs();
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("DebugRemove/{address}")]
        public async Task<IActionResult> DebugRemove(string address) {
            ServiceResponse<List<EventLog<WhitelistRemoveEventDTO>>> response = await _chainInteractionService.GetWhiteListRemoveEventLogs(address);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("Whitelisted/{address}")]
        public async Task<IActionResult> IsWhiteListed(string address) {
            bool response = await _chainInteractionService.IsWhiteListed(address);
            return Ok(response);
        }
    }
}