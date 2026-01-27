#nullable disable

using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Collections.Generic;

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
            await SendEmailWithAttachmentsAsync(email, subject, htmlMessage, null);
        }

        public async Task SendEmailWithAttachmentsAsync(string email, string subject, string htmlMessage, List<IFormFile> attachments)
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

            if (attachments != null && attachments.Count > 0)
            {
                foreach (var file in attachments)
                {
                    if (file.Length > 0)
                    {
                        var stream = file.OpenReadStream();
                        var mailAttachment = new Attachment(stream, file.FileName);
                        mailMessage.Attachments.Add(mailAttachment);
                    }
                }
            }

            await client.SendMailAsync(mailMessage);
        }
    }
}