using System;
using System.Collections.Generic;
using SU_COIN_BACK_END.Models;

namespace SU_COIN_BACK_END.DTOs
{
    public class ProjectTemplateDTO
    {
        public int ProjectID {get; set;}
        public string ProjectName {get; set;}
        public string Abstract {get; set;}
        public string ProjectDetails {get; set;}
    }
}