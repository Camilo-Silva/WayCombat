namespace WayCombat.Api.DTOs
{
    public class GoogleUserInfoDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Picture { get; set; } = string.Empty;
        public bool Verified_email { get; set; }
    }
}
