namespace SU_COIN_BACK_END.Models{

    public class User{
        public int Id {get; set;}
        public string Name{get; set;}
        public string Surname {get; set;}
        public string Address {get; set;}
        public int SUNET_ID {get; set;} = -1;
        public string MailAddress {get; set;}
        public string Username{get; set;} = null;
        public string Role {get; set;} =  "Base";
        public Nullable<int> Nonce {get; set;} = null;

    }
}