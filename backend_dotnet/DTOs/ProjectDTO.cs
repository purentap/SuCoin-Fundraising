using System;
using System.Collections.Generic;
using SU_COIN_BACK_END.Models;

namespace SU_COIN_BACK_END.DTOs
{
    public class ProjectDTO
    {
        public int ProjectID {get; set;}
        public string ProjectName {get; set;}
        public string ProjectDescription {get; set;}
        public string ImageUrl{get; set;}= null;
        public Nullable<double> Rating{get; set;}= null;
        public string Status {get; set;} = "Pending";
        public string MarkDown {get; set;} = "";
        public string fileHex {get; set;} = "";
        public string? ProposerAddress {get; set;} = null;

    }
}