using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Eventer.Data; 
using Eventer.Models; 
using System.Linq;
using System.Threading.Tasks;
using System;

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
            return View(new Event());
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Event eventModel)
        {
            ModelState.Remove("Id");
            ModelState.Remove("UserId");
            ModelState.Remove("CreatedDate");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            eventModel.UserId = userId;
            eventModel.CreatedDate = DateTime.Now;

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Add(eventModel);
                    await _context.SaveChangesAsync();
                    return RedirectToAction(nameof(MySavedEvents));
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError("", "Błąd zapisu do bazy: " + ex.Message + (ex.InnerException != null ? " | " + ex.InnerException.Message : ""));
                }
            }

            foreach (var modelState in ModelState.Values)
            {
                foreach (var error in modelState.Errors)
                {
                    Console.WriteLine($"Błąd walidacji CREATE: {error.ErrorMessage}");
                }
            }

            return View(eventModel);
        }

        [Authorize]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var @event = await _context.Events.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

            if (@event == null) return NotFound();

            return View("Create", @event);
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Event eventModel)
        {
            if (id != eventModel.Id) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var existingEvent = await _context.Events.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
            
            if (existingEvent == null) return NotFound();

            ModelState.Remove("UserId");
            ModelState.Remove("CreatedDate");

            eventModel.UserId = userId;
            eventModel.CreatedDate = existingEvent.CreatedDate; 

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(eventModel);
                    await _context.SaveChangesAsync();
                    return RedirectToAction(nameof(MySavedEvents));
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!EventExists(eventModel.Id)) return NotFound();
                    else throw;
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError("", "Błąd aktualizacji bazy: " + ex.Message);
                }
            }

            foreach (var modelState in ModelState.Values)
            {
                foreach (var error in modelState.Errors)
                {
                    Console.WriteLine($"Błąd walidacji EDIT: {error.ErrorMessage}");
                }
            }

            return View("Create", eventModel);
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

        [Authorize]
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var @event = await _context.Events.FindAsync(id);

            if (@event != null && @event.UserId == userId)
            {
                _context.Events.Remove(@event);
                await _context.SaveChangesAsync();
            }

            return RedirectToAction(nameof(MySavedEvents));
        }

        private bool EventExists(int id)
        {
            return _context.Events.Any(e => e.Id == id);
        }
    }
}