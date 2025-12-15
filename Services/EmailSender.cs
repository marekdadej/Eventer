#nullable disable

using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace Eventer.Services
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;

        public EmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            var mailSettings = _configuration.GetSection("MailSettings");
            
            string fromMail = mailSettings["Mail"] ?? "";
            string fromPassword = mailSettings["Password"] ?? "";
            string host = mailSettings["Host"] ?? "smtp.gmail.com";
            string portString = mailSettings["Port"] ?? "587";
            
            int port = int.Parse(portString); 

            var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(fromMail, fromPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage(fromMail, email, subject, htmlMessage) 
            {
                IsBodyHtml = true
            };

            await client.SendMailAsync(mailMessage);
        }
    }
}