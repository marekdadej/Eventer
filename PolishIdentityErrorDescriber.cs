using Microsoft.AspNetCore.Identity;

namespace Eventer
{
    // Ta klasa służy do tłumaczenia systemowych błędów Identity na polski
    public class PolishIdentityErrorDescriber : IdentityErrorDescriber
    {
        // Błąd: Nazwa użytkownika/Email zajęty
        public override IdentityError DuplicateUserName(string userName)
        {
            return new IdentityError
            {
                Code = nameof(DuplicateUserName),
                Description = $"Adres email '{userName}' jest już zajęty."
            };
        }

        public override IdentityError DuplicateEmail(string email)
        {
            return new IdentityError
            {
                Code = nameof(DuplicateEmail),
                Description = $"Adres email '{email}' jest już zajęty."
            };
        }

        // Błąd: Hasło zbyt krótkie
        public override IdentityError PasswordTooShort(int length)
        {
            return new IdentityError
            {
                Code = nameof(PasswordTooShort),
                Description = $"Hasło musi mieć co najmniej {length} znaków."
            };
        }

        // Błąd: Hasło nie ma cyfry
        public override IdentityError PasswordRequiresDigit()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresDigit),
                Description = "Hasło musi zawierać co najmniej jedną cyfrę ('0'-'9')."
            };
        }

        // Błąd: Hasło nie ma dużej litery
        public override IdentityError PasswordRequiresUpper()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresUpper),
                Description = "Hasło musi zawierać co najmniej jedną wielką literę ('A'-'Z')."
            };
        }
        
        // Błąd: Hasło nie ma znaku specjalnego
        public override IdentityError PasswordRequiresNonAlphanumeric()
        {
             return new IdentityError
            {
                Code = nameof(PasswordRequiresNonAlphanumeric),
                Description = "Hasło musi zawierać co najmniej jeden znak specjalny (np. ! @ # $)."
            };
        }
    }
}