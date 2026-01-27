using Microsoft.AspNetCore.Mvc;

namespace Eventer.Controllers
{
    public class GalleryController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
