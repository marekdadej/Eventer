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

    public DbSet<Event> Events { get; set; }

    public DbSet<Realizacja> Realizacje { get; set; }
    public DbSet<ZdjecieRealizacji> ZdjeciaRealizacji { get; set; }
}