using System;
using System.Text;
using Konscious.Security.Cryptography;

namespace LoyaltyCards.Infrastructure.Security;

/// <summary>
/// Argon2id: Handles everything related to Password Hashing including comparing hashes.
/// </summary>
public class PasswordHasher
{
    private const int SaltSize = 16; // bytes
    private const int HashSize = 32; // bytes
    private const int Iterations = 4;
    private const int MemorySize = 64 * 1024; // 64MB
    private readonly int DegreeOfParallelism = Environment.ProcessorCount;

    public string Hash(string passwordPlaintext)
    {
        if (string.IsNullOrWhiteSpace(passwordPlaintext))
            throw new ArgumentException("Password cannot be empty.");

        var passwordBytes = Encoding.UTF8.GetBytes(passwordPlaintext);

        var salt = new byte[SaltSize];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(salt);
        }

        using var argon2id = new Argon2id(passwordBytes)
        {
            Salt = salt,
            // KnownSecret,
            // AssociatedData,
            Iterations = Iterations,
            MemorySize = MemorySize,
            DegreeOfParallelism = DegreeOfParallelism
        };

        var hashBytes = argon2id.GetBytes(HashSize);

        // Build standard encoded Argon2id string
        var b64Salt = Convert.ToBase64String(salt);
        var b64Hash = Convert.ToBase64String(hashBytes);

        var encoded = $"$argon2id$v=19$m={MemorySize},t={Iterations},p={DegreeOfParallelism}${b64Salt}${b64Hash}";

        return encoded;
    }

    public bool Verify(string password, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(storedHash))
            return false;

        try
        {
            // split into parts
            // Format: $argon2id$v=...$m=...,t=...,p=...$<salt>$<hash>
            var parts = storedHash.Split('$', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 5 || parts[0] != "argon2id")
                return false;

            var version = parts[1]; // v=...
            var paramPart = parts[2]; // m=...,t=...,p=...
            var saltB64 = parts[3];
            var hashB64 = parts[4];

            // parse parameters
            var paramPairs = paramPart.Split(',');
            int memory = 0, iterations = 0, parallelism = 0;
            foreach (var pair in paramPairs)
            {
                var kv = pair.Split('=');
                if (kv.Length != 2) continue;

                switch (kv[0])
                {
                    case "m": memory = int.Parse(kv[1]); break;
                    case "t": iterations = int.Parse(kv[1]); break;
                    case "p": parallelism = int.Parse(kv[1]); break;
                }
            }

            var salt = Convert.FromBase64String(saltB64);
            var hash = Convert.FromBase64String(hashB64);

            var passwordBytes = Encoding.UTF8.GetBytes(password);

            // recompute hash
            using var argon2 = new Argon2id(passwordBytes)
            {
                Salt = salt,
                Iterations = iterations,
                MemorySize = memory,
                DegreeOfParallelism = parallelism
            };

            var computedHash = argon2.GetBytes(hash.Length);

            // constant-time comparison
            return AreEqual(computedHash, hash);
        }
        catch
        {
            return false;
        }
    }

    private static bool AreEqual(byte[] a, byte[] b)
    {
        if (a.Length != b.Length) return false;

        int diff = 0;
        for (int i = 0; i < a.Length; i++)
            diff |= a[i] ^ b[i];

        return diff == 0;
    }
}
