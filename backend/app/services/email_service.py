import smtplib
import ssl
from email.message import EmailMessage

from app.config import Config


class EmailService:
    @staticmethod
    def is_configured() -> bool:
        return all(
            [
                Config.SMTP_HOST,
                Config.SMTP_PORT,
                Config.SMTP_FROM_EMAIL,
                Config.FRONTEND_BASE_URL,
            ]
        )

    @staticmethod
    def send_password_reset_email(*, to_email: str, reset_url: str):
        if not EmailService.is_configured():
            raise RuntimeError("SMTP is not configured.")

        message = EmailMessage()
        message["Subject"] = "Recupera tu contrasena de MetalWolft"
        message["From"] = Config.SMTP_FROM_EMAIL
        message["To"] = to_email
        message.set_content(
            "\n".join(
                [
                    "Hola,",
                    "",
                    "Hemos recibido una solicitud para restablecer tu contrasena en MetalWolft.",
                    f"Abre este enlace para elegir una nueva contrasena: {reset_url}",
                    "",
                    f"El enlace caduca en {Config.PASSWORD_RESET_TOKEN_TTL_MINUTES} minutos.",
                    "Si no has solicitado este cambio, puedes ignorar este correo.",
                ]
            )
        )

        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as smtp:
            if Config.SMTP_USE_TLS:
                smtp.starttls(context=ssl.create_default_context())

            if Config.SMTP_USERNAME and Config.SMTP_PASSWORD:
                smtp.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)

            smtp.send_message(message)
