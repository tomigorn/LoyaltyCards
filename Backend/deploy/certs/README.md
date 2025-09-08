# SSL Certificate Generation

## Generate Certificates
Run this command on the RaspberryPi to generate the required SSL certificates:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ~/docker/development/loyalty-cards-app/certs/cert.key \
    -out ~/docker/development/loyalty-cards-app/certs/cert.pem \
    -subj "/C=CH/ST=Zurich/L=Zurich/O=LoyaltyCards/CN=fastpi.local"
```

This will create:
- `cert.key`: Private key file
- `cert.pem`: Certificate file

## Important Notes
- Keep the .key file secure and never commit it to version control
- Certificates expire after 365 days
- The CN (Common Name) should match your server's domain