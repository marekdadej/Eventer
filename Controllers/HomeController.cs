using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Eventer.Models;
using Microsoft.AspNetCore.Identity.UI.Services;
using Eventer.Services;

namespace Eventer.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly IEmailSender _emailSender;

    public HomeController(ILogger<HomeController> logger, IEmailSender emailSender)
    {
        _logger = logger;
        _emailSender = emailSender;
    }

    public IActionResult Index()
    {
        return View();
    }

    public IActionResult About()
    {
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    public IActionResult Offer()
    {
        return View();
    }

    public IActionResult Contact()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage(string firstName, string lastName, string email, string message, List<IFormFile> attachments)
    {
        if (attachments != null && attachments.Count > 0)
        {
            long totalSize = attachments.Sum(f => f.Length);
            if (totalSize > 20 * 1024 * 1024) 
            {
                TempData["SuccessMessage"] = "Łączny rozmiar plików jest za duży (max 20MB).";
                return RedirectToAction("Contact");
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".txt" };
            foreach (var file in attachments)
            {
                var extension = Path.GetExtension(file.FileName).ToLower();
                if (!allowedExtensions.Contains(extension))
                {
                    TempData["SuccessMessage"] = $"Niedozwolony format pliku: {file.FileName}";
                    return RedirectToAction("Contact");
                }
            }
        }

        string adminEmail = "marek.dadej03@gmail.com";
        string subject = $"Nowa wiadomość ze strony: {firstName} {lastName}";

        int fileCount = attachments != null ? attachments.Count : 0;

        string htmlBody = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;'>
                <h2 style='color: #333;'>Nowe zapytanie z formularza</h2>
                <p><strong>Imię i Nazwisko:</strong> {firstName} {lastName}</p>
                <p><strong>Email klienta:</strong> <a href='mailto:{email}'>{email}</a></p>
                <hr />
                <p><strong>Treść wiadomości:</strong></p>
                <p style='background-color: #f9f9f9; padding: 15px;'>{message}</p>
                <br />
                {(fileCount > 0 ? $"<p><strong>Dołączono plików: {fileCount}</strong></p>" : "")}
                <small style='color: #888;'>Wiadomość wygenerowana automatycznie przez system Eventer.</small>
            </div>
        ";

        try 
        {
            if (_emailSender is EmailSender customSender)
            {
                await customSender.SendEmailWithAttachmentsAsync(adminEmail, subject, htmlBody, attachments);
            }
            else
            {
                await _emailSender.SendEmailAsync(adminEmail, subject, htmlBody);
            }
            
            TempData["SuccessMessage"] = "Dziękujemy! Twoja wiadomość została wysłana.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas wysyłania maila z formularza kontaktowego.");
            TempData["SuccessMessage"] = "Wystąpił problem z wysłaniem wiadomości. Spróbuj ponownie później.";
        }
        
        return RedirectToAction("Contact");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}