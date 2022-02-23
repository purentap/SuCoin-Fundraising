using System;

namespace SU_COIN_BACK_END.Models
{
    public class Project
    {
        public int ProjectID {get; set;}
        public string ProjectName {get; set;}
        public Nullable<System.DateTime> Date {get; set;}
        public bool IsApproved {get; set;} = false;
        public string FileHex {get; set;} = "";
        public int TxnID {get; set;} = -1;
        public string ProjectDescription {get; set;}
        public string ImageUrl{get; set;} = null;
        public double Rating{get; set;} = 0;
        public string Status {get; set;}= "Pending";
        public string MarkDown {get; set;} = "";
        public string? ProposerAddress {get; set;} = null;
    }
}