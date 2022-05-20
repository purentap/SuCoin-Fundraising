using SU_COIN_BACK_END.Constants.ProjectStatusConstants;

namespace SU_COIN_BACK_END.Request
{
    public class ProjectRequest
    {
        public int ProjectID { get; set; }
        public string ProjectName { get; set; } = "";
        public Nullable<System.DateTime> Date { get; set; }
        public string? ProjectDescription { get; set; }
        public string? ImageUrl { get; set; } = null;
        public string MarkDown { get; set; } = "";
        public string FileHex { get; set; } = "";
    }
}