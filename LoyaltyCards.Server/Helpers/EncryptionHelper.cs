using System.Security.Cryptography;
using System.Text;

namespace LoyaltyCards.Server.Helpers
{
    public class EncryptionHelper
    {
        private static readonly string encryptionKey = "very_secure_fixed_key_32_chars!!";

        public static string Encrypt(string plainText)
        {
            using var aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(encryptionKey);
            aes.GenerateIV();
            var iv = aes.IV;

            using var encryptor = aes.CreateEncryptor(aes.Key, iv);
            using var ms = new MemoryStream();
            using var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write);
            using var sw = new StreamWriter(cs);
            sw.Write(plainText);

            var encrypted = ms.ToArray();
            var result = Convert.ToBase64String(iv.Concat(encrypted).ToArray());
            return result;
        }

        public static string Decrypt(string encryptedText)
        {
            var fullData = Convert.FromBase64String(encryptedText);
            var iv = fullData.Take(16).ToArray();
            var cipher = fullData.Skip(16).ToArray();

            using var aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(encryptionKey);
            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(cipher);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);
            var result = sr.ReadToEnd();
            return result;
        }
    }
}
