using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Eventer.Models;

namespace Eventer.Data;

public class ApplicationDbContext : IdentityDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Tabela dla ogólnych wydarzeń/kalendarza
    public DbSet<Event> Events { get; set; }

    // Główne tabele dla Twojej nowej galerii realizacji
    public DbSet<Realizacja> Realizacje { get; set; }
    public DbSet<ZdjecieRealizacji> ZdjeciaRealizacji { get; set; }
}