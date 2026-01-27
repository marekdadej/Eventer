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

        // GET: Events/Create
        [Authorize]
        public IActionResult Create()
        {
            // Przekazujemy pusty model
            return View(new Event());
        }

        // POST: Events/Create
        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Event eventModel)
        {
            // 1. Ignorujemy walidację pól systemowych (bo ustawiamy je ręcznie poniżej)
            ModelState.Remove("Id");
            ModelState.Remove("UserId");
            ModelState.Remove("CreatedDate");

            // 2. Ustawiamy dane systemowe
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            eventModel.UserId = userId;
            eventModel.CreatedDate = DateTime.Now;

            // 3. Sprawdzamy czy reszta danych jest poprawna
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
                    // Łapanie błędów bazy danych (np. brakująca kolumna)
                    ModelState.AddModelError("", "Błąd zapisu do bazy: " + ex.Message + (ex.InnerException != null ? " | " + ex.InnerException.Message : ""));
                }
            }

            // --- DEBUGOWANIE ---
            foreach (var modelState in ModelState.Values)
            {
                foreach (var error in modelState.Errors)
                {
                    Console.WriteLine($"Błąd walidacji CREATE: {error.ErrorMessage}");
                }
            }

            return View(eventModel);
        }

        // GET: Events/Edit/5
        [Authorize]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            // Pobieramy wydarzenie tylko jeśli należy do zalogowanego użytkownika
            var @event = await _context.Events.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

            if (@event == null) return NotFound();

            // Używamy widoku "Create" do edycji, formularz sam rozpozna tryb dzięki modelowi
            return View("Create", @event);
        }

        // POST: Events/Edit/5
        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Event eventModel)
        {
            if (id != eventModel.Id) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Pobieramy oryginał z bazy (bez śledzenia zmian), żeby sprawdzić własność i datę
            var existingEvent = await _context.Events.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
            
            if (existingEvent == null) return NotFound();

            // 1. Ignorujemy walidację pól, których nie ma w formularzu edycji
            ModelState.Remove("UserId");
            ModelState.Remove("CreatedDate");

            // 2. Przywracamy dane systemowe (żeby nie zginęły przy Update)
            eventModel.UserId = userId;
            eventModel.CreatedDate = existingEvent.CreatedDate; // Zachowujemy oryginalną datę utworzenia

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

            // --- DEBUGOWANIE BŁĘDÓW EDYCJI ---
            foreach (var modelState in ModelState.Values)
            {
                foreach (var error in modelState.Errors)
                {
                    Console.WriteLine($"Błąd walidacji EDIT: {error.ErrorMessage}");
                }
            }

            // Jeśli błąd, wracamy do widoku Create (który służy też jako Edit)
            return View("Create", eventModel);
        }

        // GET: Events/MySavedEvents
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

        // POST: Events/Delete/5
        [Authorize]
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var @event = await _context.Events.FindAsync(id);

            // Sprawdzamy czy to wydarzenie tego użytkownika
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