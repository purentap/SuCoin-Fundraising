using SU_COIN_BACK_END.Constants.ProjectStatusConstants;

namespace SU_COIN_BACK_END.DTOs
{
    public class ProjectDTO
    {
        public int ProjectID { get; set; }
        public string ProjectName { get; set; } = "";
        public Nullable<System.DateTime> Date { get; set; }
        public bool IsAuctionCreated { get; set; } = false;
        public string? ProjectDescription { get; set; }
        public string? ImageUrl { get; set; } = null;
        public double Rating { get; set; } = 0;
        public string Status { get; set; } = ProjectStatusConstants.PENDING;
        public string MarkDown { get; set; } = "";
        public string FileHash { get; set; } = "";
        public string? ProposerAddress { get; set; } = null;
        public string? ViewerAcceptedAddress { get; set; } = null;
    }
}