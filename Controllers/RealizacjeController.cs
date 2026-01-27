using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Eventer.Data;
using Eventer.Models;
using Microsoft.AspNetCore.Authorization;

namespace Eventer.Controllers;

public class RealizacjeController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _hostEnvironment;

    // Lista zaufanych administratorów
    private readonly List<string> _adminEmails = new List<string> 
    { 
        "nd.dadej@gmail.com", 
        "kd.dadej@gmail.com", 
        "beata.kurant@gmail.com" 
    };

    public RealizacjeController(ApplicationDbContext context, IWebHostEnvironment hostEnvironment)
    {
        _context = context;
        _hostEnvironment = hostEnvironment;
    }

    // Metoda sprawdzająca uprawnienia
    private bool CzyToAdmin() => User.Identity != null && User.Identity.IsAuthenticated && _adminEmails.Contains(User.Identity.Name);

    // 1. LISTA
    public async Task<IActionResult> Index()
    {
        var realizacje = await _context.Realizacje
            .OrderByDescending(r => r.Data)
            .ToListAsync();

        ViewBag.CzyAdmin = CzyToAdmin();
        return View(realizacje);
    }

    // 2. SZCZEGÓŁY
    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();

        var realizacja = await _context.Realizacje
            .Include(r => r.Galeria)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (realizacja == null) return NotFound();

        ViewBag.CzyAdmin = CzyToAdmin();
        return View(realizacja);
    }

    // 3. DODAWANIE (GET)
    [Authorize]
    public IActionResult Create()
    {
        if (!CzyToAdmin()) return Forbid();
        return View();
    }

    // 4. DODAWANIE (POST)
    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Realizacja realizacja)
    {
        if (!CzyToAdmin()) return Forbid();

        if (ModelState.IsValid)
        {
            if (realizacja.MiniaturkaFile != null)
                realizacja.MiniaturkaUrl = await ZapiszPlik(realizacja.MiniaturkaFile);

            if (realizacja.GaleriaFiles != null)
            {
                foreach (var plik in realizacja.GaleriaFiles)
                {
                    var url = await ZapiszPlik(plik);
                    realizacja.Galeria.Add(new ZdjecieRealizacji { Url = url });
                }
            }

            _context.Add(realizacja);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(realizacja);
    }

    // 5. EDYCJA (GET)
    [Authorize]
    public async Task<IActionResult> Edit(int? id)
    {
        if (!CzyToAdmin() || id == null) return Forbid();

        var realizacja = await _context.Realizacje
            .Include(r => r.Galeria)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (realizacja == null) return NotFound();

        return View(realizacja);
    }

    // 6. EDYCJA (POST)
    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, Realizacja realizacja)
    {
        if (!CzyToAdmin()) return Forbid();
        if (id != realizacja.Id) return NotFound();

        if (ModelState.IsValid)
        {
            try
            {
                if (realizacja.MiniaturkaFile != null)
                {
                    realizacja.MiniaturkaUrl = await ZapiszPlik(realizacja.MiniaturkaFile);
                }

                if (realizacja.GaleriaFiles != null && realizacja.GaleriaFiles.Count > 0)
                {
                    foreach (var plik in realizacja.GaleriaFiles)
                    {
                        var url = await ZapiszPlik(plik);
                        _context.ZdjeciaRealizacji.Add(new ZdjecieRealizacji 
                        { 
                            Url = url, 
                            RealizacjaId = id 
                        });
                    }
                }

                _context.Update(realizacja);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Realizacje.Any(e => e.Id == realizacja.Id)) return NotFound();
                else throw;
            }
            return RedirectToAction(nameof(Index));
        }
        return View(realizacja);
    }

    // 7. USUWANIE POJEDYNCZEGO ZDJĘCIA PRZEZ AJAX (WYWOŁYWANE Z EDYCJI)
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> UsunZdjecie(int id)
    {
        if (!CzyToAdmin()) return Forbid();

        var zdjecie = await _context.ZdjeciaRealizacji.FindAsync(id);
        if (zdjecie == null) return NotFound();

        // Usuwanie fizyczne pliku z dysku
        UsunPlikZDysku(zdjecie.Url);

        _context.ZdjeciaRealizacji.Remove(zdjecie);
        await _context.SaveChangesAsync();

        return Ok();
    }

    // 8. USUWANIE CAŁEJ REALIZACJI
    [Authorize]
    public async Task<IActionResult> Delete(int? id)
    {
        if (!CzyToAdmin() || id == null) return Forbid();

        var realizacja = await _context.Realizacje
            .Include(r => r.Galeria)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (realizacja == null) return NotFound();

        // 1. Usuń miniaturkę z dysku
        UsunPlikZDysku(realizacja.MiniaturkaUrl);

        // 2. Usuń wszystkie zdjęcia z galerii z dysku
        foreach (var foto in realizacja.Galeria)
        {
            UsunPlikZDysku(foto.Url);
        }

        // 3. Usuń rekordy z bazy (galeria zostanie usunięta kaskadowo lub ręcznie)
        _context.ZdjeciaRealizacji.RemoveRange(realizacja.Galeria);
        _context.Realizacje.Remove(realizacja);
        
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    // --- POMOCNIKI ---

    private async Task<string> ZapiszPlik(IFormFile plik)
    {
        string wwwRootPath = _hostEnvironment.WebRootPath;
        string nazwaPliku = Guid.NewGuid().ToString() + Path.GetExtension(plik.FileName);
        string sciezkaDocelowa = Path.Combine(wwwRootPath, "uploads/realizacje");

        if (!Directory.Exists(sciezkaDocelowa))
            Directory.CreateDirectory(sciezkaDocelowa);

        using (var stream = new FileStream(Path.Combine(sciezkaDocelowa, nazwaPliku), FileMode.Create))
        {
            await plik.CopyToAsync(stream);
        }

        return "/uploads/realizacje/" + nazwaPliku;
    }

    private void UsunPlikZDysku(string? url)
    {
        if (string.IsNullOrEmpty(url)) return;

        string sciezkaPliku = Path.Combine(_hostEnvironment.WebRootPath, url.TrimStart('/'));
        if (System.IO.File.Exists(sciezkaPliku))
        {
            System.IO.File.Delete(sciezkaPliku);
        }
    }
}