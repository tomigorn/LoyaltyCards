using System.Security.Cryptography;
using System.Text;

namespace LoyaltyCards.Server.Helpers
{
    /// <summary>
    /// AES = Advanced Encryption Standard
    /// Is a symmetric encryption algorithm.
    /// 
    /// - Generate encryption keys/derive keys from user passwords
    /// - Encrypt plaintext sensitive data
    /// - Decrypt ciphertext back to sensitive plaintext
    /// - Handle initialization vectors (IVs), padding, and other AES-specific details
    /// - Ensure cryptographic operations are done securely and correctly
    /// </summary>
    public static class AesEncryptionHelper
    {
        public static byte[] DeriveKey(string password, byte[] salt)
        {
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            return pbkdf2.GetBytes(32);
        }

        public static (byte[] Ciphertext, byte[] Nonce, byte[] Tag) Encrypt(string plaintext, byte[] key)
        {
            using var aes = new AesGcm(key);
            byte[] nonce = RandomNumberGenerator.GetBytes(12);
            byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            byte[] ciphertext = new byte[plaintextBytes.Length];
            byte[] tag = new byte[16];

            aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);
            return (ciphertext, nonce, tag);
        }

        public static string Decrypt(byte[] ciphertext, byte[] nonce, byte[] tag, byte[] key)
        {
            using var aes = new AesGcm(key);
            byte[] plaintextBytes = new byte[ciphertext.Length];
            aes.Decrypt(nonce, ciphertext, tag, plaintextBytes);
            return Encoding.UTF8.GetString(plaintextBytes);
        }
    }
}
