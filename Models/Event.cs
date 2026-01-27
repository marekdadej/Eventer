using System;
using System.ComponentModel.DataAnnotations;

namespace Eventer.Models
{
    public class Event
    {
        [Key]
        public int Id { get; set; }
        
        [Required(ErrorMessage = "Nazwa jest wymagana")]
        public string? Name { get; set; }
        
        public string? UserId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public string? ImageUrl { get; set; }

        // --- Główne parametry ---
        public string? MainType { get; set; }   // stageWithRoof, stageNoRoof, layherTower, ledWall
        public string? EnvMode { get; set; }    // mono, natural

        // --- Podłoga ---
        public string? FloorType { get; set; }  // layher, peri
        public double StageWidth { get; set; }
        public double StageDepth { get; set; }
        public double StageHeight { get; set; }
        public bool ShowMausery { get; set; }

        // --- Dach (Ogólne) ---
        public bool IncludeRoof { get; set; }
        public string? RoofType { get; set; }   // prolyte, layher
        public string? RoofSystem { get; set; } // (Pole legacy - można zostawić dla starych rekordów)

        // --- Opcje Dachu Prolyte ---
        public string? ProlyteVariant { get; set; } // standard, layher_base, suspended, frame
        public double RoofClearance { get; set; }
        public bool ProlyteScrim { get; set; }
        public bool AddBallast { get; set; }
        public int WingWidthBays { get; set; }
        public int WingDepthBays { get; set; }      
        public string? WingType { get; set; }       

        // --- Opcje Dachu Layher ---
        public double LayherRoofHeight { get; set; }
        public double LayherRoofSlope { get; set; }
        public bool LayherScrim { get; set; }

        // --- FOH (Realizatorka) ---
        public bool IncludeFoh { get; set; }
        public string? FohType { get; set; }    // ground, twoStory, threeStory
        public double FohWidth { get; set; }
        public double FohDepth { get; set; }
        public double FohDist { get; set; }
        public bool FohScrim { get; set; }
        public bool FohTower { get; set; }      // Wieża Delay (Checkbox)

        // --- Wieże / Inne konstrukcje ---
        public int TowerWidthBays { get; set; } 
        public double TowerDepth { get; set; }  
        public double TowerHeight { get; set; } 

        // --- Dodatki ---
        public string? CatwalkType { get; set; } // none, single, double
        public double CatwalkDepth { get; set; }
        public int RiserCount { get; set; }
        public string? RiserSide { get; set; }
        public double RiserWidth { get; set; }
        public double RiserDepth { get; set; }

        // --- Pola Legacy (Dla kompatybilności) ---
        public double Clearance { get; set; }   
        public bool HasScrim { get; set; }      
        public int FohLevel { get; set; }       
        public string? FohSize { get; set; }    
    }
}