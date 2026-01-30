using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Http;

namespace Eventer.Models;

public class Realizacja
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Musisz podać nazwę wydarzenia.")]
    [Display(Name = "Nazwa wydarzenia")]
    public string Nazwa { get; set; } = string.Empty;

    [Required(ErrorMessage = "Data jest wymagana do poprawnego sortowania.")]
    [DataType(DataType.Date)]
    [Display(Name = "Data realizacji")]
    public DateTime Data { get; set; } = DateTime.Now;

    [Required(ErrorMessage = "Opis prac jest wymagany.")]
    [Display(Name = "Opis wykonanych prac")]
    public string Opis { get; set; } = string.Empty;

    public string? MiniaturkaUrl { get; set; }

    
    [NotMapped]
    [Display(Name = "Zdjęcie główne (plik)")]
    public IFormFile? MiniaturkaFile { get; set; }

    [NotMapped]
    [Display(Name = "Dodaj zdjęcia do galerii")]
    public List<IFormFile>? GaleriaFiles { get; set; }

    public virtual ICollection<ZdjecieRealizacji> Galeria { get; set; } = new List<ZdjecieRealizacji>();
}

public class ZdjecieRealizacji
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public int RealizacjaId { get; set; }
    public virtual Realizacja? Realizacja { get; set; }
}