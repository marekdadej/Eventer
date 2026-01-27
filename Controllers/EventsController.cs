using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Eventer.Data; 
using Eventer.Models; 

namespace Eventer.Controllers
{
    public class EventsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public EventsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            return View();
        }

        [Authorize]
        public IActionResult Create()
        {
            return View();
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Event eventModel)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            eventModel.UserId = userId;
            eventModel.CreatedDate = DateTime.Now;

            _context.Add(eventModel);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(MySavedEvents));
        }

        [Authorize]
        public async Task<IActionResult> MySavedEvents()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var userEvents = await _context.Events
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.CreatedDate)
                .ToListAsync();

            return View(userEvents);
        }
    }
}