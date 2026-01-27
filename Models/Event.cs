using System;
using System.ComponentModel.DataAnnotations;

namespace Eventer.Models
{
    public class Event
    {
        [Key]
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? UserId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public string? ImageUrl { get; set; }

        // --- Główne parametry ---
        public string? MainType { get; set; }   // stage, tower, wall
        public string? RoofSystem { get; set; } // prolyte, alustage, layher, none

        // --- Wymiary Sceny ---
        public double StageWidth { get; set; }
        public double StageDepth { get; set; }
        public double StageHeight { get; set; }
        public double Clearance { get; set; }   // Prześwit dachu
        public bool HasScrim { get; set; }      // Czy jest siatka

        // --- Wingi (Boki) ---
        public int WingWidthBays { get; set; }  // Ilość pól na szerokość
        public int WingDepthBays { get; set; }  // Ilość pól na głębokość
        public string? WingType { get; set; }   // layher / scrim

        // --- FOH (Realizatorka) ---
        public int FohLevel { get; set; }       // 0, 1, 2 piętra
        public string? FohSize { get; set; }    // np. "4.14|2.07"
        public double FohDist { get; set; }     // Dystans
        public bool FohScrim { get; set; }      // Siatki FOH
        public string? FohTower { get; set; }   // Czy jest wieża delay

        // --- Wieża / Ściana (Inne typy) ---
        public int TowerWidthBays { get; set; }
        public double TowerDepth { get; set; }
        public double TowerHeight { get; set; }
    }
}